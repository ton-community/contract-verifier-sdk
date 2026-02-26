import { TonClient4, Address, TupleReader, TupleBuilder } from "ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Sha256 } from "@aws-crypto/sha256-js";

interface GetSourcesOptions {
  verifier?: string;
  httpApiEndpointV4?: string;
  testnet?: boolean;
}

export declare type FuncCompilerVersion = string;
export declare type TactVersion = string;
export declare type FiftVersion = FuncCompilerVersion; // Fift is tied to a FunC version
export declare type TolkVersion = string;

export declare type FuncCompilerSettings = {
  funcVersion: FuncCompilerVersion;
  commandLine: string;
};
export type FiftCliCompileSettings = {
  fiftVersion: FiftVersion;
  commandLine: string;
};
export type TactCliCompileSettings = {
  tactVersion: TactVersion;
};

export type TolkCliCompileSettings = {
  tolkVersion: TolkVersion;
};


export type FuncSource = {
  name: string;
  content: string;
  isEntrypoint: boolean;
};
export type TolkSource = {
    name: string;
    content: string;
    isEntrypoint: boolean;
}

export type TactSource = {
  name: string;
  content: string;
};

export interface SourcesData {
  files: (TactSource | FuncSource | TolkSource)[];
  compiler: "func" | "tact" | "fift" | "tolk";
  compilerSettings:
    | FuncCompilerSettings
    | FiftCliCompileSettings
    | TolkCliCompileSettings
    | TactCliCompileSettings;
  verificationDate: Date;
  ipfsHttpLink: string;
}

type IpfsUrlConverterFunc = (ipfsUrl: string, testnet: boolean) => string;

const SOURCES_REGISTRY = Address.parse(
  "EQD-BJSVUJviud_Qv7Ymfd3qzXdrmV525e3YDzWQoHIAiInL",
);
const SOURCES_REGISTRY_TESTNET = Address.parse(
  "EQCsdKYwUaXkgJkz2l0ol6qT_WxeRbE_wBCwnEybmR0u5TO8",
);

function toSha256Buffer(s: string) {
  const sha = new Sha256();
  sha.update(s);
  return Buffer.from(sha.digestSync());
}

function defaultIpfsConverter(ipfs: string) {
  let endpoint: string;
  endpoint = "https://gateway.pinata.cloud/ipfs/";

  return ipfs.replace("ipfs://", endpoint);
}

function bigIntFromBuffer(buffer: Buffer) {
  return BigInt(`0x${buffer.toString("hex")}`);
}

export const ContractVerifier = {
  async getSourcesJsonUrl(
    codeCellHash: string,
    options?: GetSourcesOptions,
  ): Promise<string | null> {
    const tc = new TonClient4({
      endpoint:
        options?.httpApiEndpointV4 ??
        (await getHttpV4Endpoint({
          network: options.testnet ? "testnet" : "mainnet",
        })),
    });
    const {
      last: { seqno },
    } = await tc.getLastBlock();

    const args = new TupleBuilder();
    args.writeNumber(
      bigIntFromBuffer(toSha256Buffer(options?.verifier ?? "verifier.ton.org")),
    );
    args.writeNumber(bigIntFromBuffer(Buffer.from(codeCellHash, "base64")));
    const { result: itemAddRes } = await tc.runMethod(
      seqno,
      options.testnet ? SOURCES_REGISTRY_TESTNET : SOURCES_REGISTRY,
      "get_source_item_address",
      args.build(),
    );

    let reader = new TupleReader(itemAddRes);
    const sourceItemAddr = reader.readAddress();
    const isDeployed = await tc.isContractDeployed(seqno, sourceItemAddr);

    if (isDeployed) {
      const { result: sourceItemDataRes } = await tc.runMethod(
        seqno,
        sourceItemAddr,
        "get_source_item_data",
      );

      reader = new TupleReader(sourceItemDataRes);
      const contentCell = reader.skip(3).readCell().beginParse();
      const version = contentCell.loadUint(8);
      if (version !== 1) throw new Error("Unsupported version");
      const ipfsLink = contentCell.loadStringTail();

      return ipfsLink;
    }
    return null;
  },

  async getSourcesData(
    sourcesJsonUrl: string,
    options?: {
      ipfsConverter?: IpfsUrlConverterFunc;
      testnet?: boolean;
    },
  ): Promise<SourcesData> {
    const ipfsConverter = options.ipfsConverter ?? defaultIpfsConverter;
    const ipfsHttpLink = ipfsConverter(sourcesJsonUrl, !!options.testnet);

    const verifiedContract = await (
      await fetch(ipfsConverter(sourcesJsonUrl, !!options.testnet))
    ).json();

    const files = (
      await Promise.all(
        verifiedContract.sources.map(
          async (source: {
            url: string;
            filename: string;
            isEntrypoint?: boolean;
          }) => {
            const url = ipfsConverter(source.url, !!options.testnet);
            const content = await fetch(url).then((u) => u.text());
            return {
              name: source.filename,
              content,
              isEntrypoint: source.isEntrypoint,
            };
          },
        ),
      )
    )
      .reverse()
      .sort((a, b) => {
        return Number(b.isEntrypoint) - Number(a.isEntrypoint);
      });

    return {
      files,
      verificationDate: new Date(verifiedContract.verificationDate),
      compilerSettings: verifiedContract.compilerSettings,
      compiler: verifiedContract.compiler,
      ipfsHttpLink,
    };
  },
};
