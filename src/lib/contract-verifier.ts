import { Address, Cell, TonClient } from "ton";
import { BN } from "bn.js";
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

export const ContractVerifier = {
  getSourcesJsonUrl: async function (
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
        [
          "num",
          new BN(toSha256Buffer(options?.verifier ?? "orbs.com")).toString(),
        ],
        ["num", new BN(Buffer.from(codeCellHash, "base64")).toString(10)],
      ]
    );

    const sourceItemAddr = Cell.fromBoc(
      Buffer.from(sourceItemAddressStack[0][1].bytes, "base64")
    )[0]
      .beginParse()
      .readAddress()!;

    const isDeployed = await tc.isContractDeployed(sourceItemAddr);

    if (isDeployed) {
      const { stack: sourceItemDataStack } = await tc.callGetMethod(
        sourceItemAddr,
        "get_source_item_data"
      );
      const contentCell = Cell.fromBoc(
        Buffer.from(sourceItemDataStack[3][1].bytes, "base64")
      )[0].beginParse();
      const version = contentCell.readUintNumber(8);
      if (version !== 1) throw new Error("Unsupported version");
      const ipfsLink = contentCell.readRemainingBytes().toString();

      return ipfsLink;
    }

    return null;
  },

  getSourcesData: async function (
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
      files: files,
      verificationDate: new Date(verifiedContract.verificationDate),
      compilerSettings: verifiedContract.compilerSettings,
      compiler: verifiedContract.compiler,
      ipfsHttpLink,
    };
  },
};
