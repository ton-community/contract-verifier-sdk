import { TonClient, Address, Cell, TupleReader } from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { Sha256 } from "@aws-crypto/sha256-js";

interface GetSourcesOptions {
  verifier?: string;
  httpApiEndpoint?: string;
  httpApiKey?: string;
}

export declare type FuncCompilerVersion = "0.2.0" | "0.3.0";
export declare type TactVersion = "0.4.0";
export declare type FiftVersion = FuncCompilerVersion; // Fift is tied to a FunC version

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

export type FuncSource = {
  name: string;
  content: string;
  isEntrypoint: boolean;
};
export type TactSource = {
  name: string;
  content: string;
  type: "code" | "abi";
};

export interface SourcesData {
  files: (TactSource | FuncSource)[];
  compiler: "func" | "tact" | "fift";
  compilerSettings:
    | FuncCompilerSettings
    | FiftCliCompileSettings
    | TactCliCompileSettings;
  verificationDate: Date;
  ipfsHttpLink: string;
}

type IpfsUrlConverterFunc = (ipfsUrl: string) => string;

const SOURCES_REGISTRY = "EQD-BJSVUJviud_Qv7Ymfd3qzXdrmV525e3YDzWQoHIAiInL";

function toSha256Buffer(s: string) {
  const sha = new Sha256();
  sha.update(s);
  return Buffer.from(sha.digestSync());
}

function defaultIpfsConverter(ipfs: string) {
  return ipfs.replace("ipfs://", "https://tonsource.infura-ipfs.io/ipfs/");
}

// https://github.com/ton-community/ton-core/pull/4
function tupleReaderSkip(t: TupleReader, num: number = 1) {
  for (let i = 0; i < num; i++) {
    t.pop();
  }
  return t;
}

export const ContractVerifier = {
  async getSourcesJsonUrl(
    codeCellHash: string,
    options?: GetSourcesOptions
  ): Promise<string | null> {
    const tc = new TonClient({
      endpoint: options?.httpApiEndpoint ?? (await getHttpEndpoint()),
      apiKey: options?.httpApiKey,
    });

    const { stack: sourceItemAddressStack } = await tc.callGetMethod(
      Address.parse(SOURCES_REGISTRY),
      "get_source_item_address",
      [
        {
          type: "int",
          value: BigInt(
            `0x${toSha256Buffer(options?.verifier ?? "orbs.com").toString(
              "hex"
            )}`
          ),
        },
        {
          type: "int",
          value: BigInt(
            `0x${Buffer.from(codeCellHash, "base64").toString("hex")}`
          ),
        },
      ]
    );

    const sourceItemAddr = sourceItemAddressStack.readAddress();

    const isDeployed = await tc.isContractDeployed(sourceItemAddr);

    if (isDeployed) {
      const { stack: sourceItemDataStack } = await tc.callGetMethod(
        sourceItemAddr,
        "get_source_item_data"
      );

      const contentCell = tupleReaderSkip(sourceItemDataStack, 3)
        .readCell()
        .beginParse();
      const version = contentCell.loadUint(8);
      if (version !== 1) throw new Error("Unsupported version");
      const ipfsLink = contentCell.loadStringTail();

      return ipfsLink;
    }

    return null;
  },

  async getSourcesData(
    sourcesJsonUrl: string,
    ipfsConverter?: IpfsUrlConverterFunc
  ): Promise<SourcesData> {
    ipfsConverter = ipfsConverter ?? defaultIpfsConverter;
    const ipfsHttpLink = ipfsConverter(sourcesJsonUrl);

    const verifiedContract = await (
      await fetch(ipfsConverter(sourcesJsonUrl))
    ).json();

    const files = (
      await Promise.all(
        verifiedContract.sources.map(
          async (source: {
            url: string;
            filename: string;
            isEntrypoint?: boolean;
            type?: "code" | "abi";
          }) => {
            const url = ipfsConverter(source.url);
            const content = await fetch(url).then((u) => u.text());
            return {
              name: source.filename,
              content,
              isEntrypoint: source.isEntrypoint,
              type: source.type,
            };
          }
        )
      )
    )
      .reverse()
      .sort((a, b) => {
        if (a.type && b.type) {
          return Number(b.type === "code") - Number(a.type === "code");
        }
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
