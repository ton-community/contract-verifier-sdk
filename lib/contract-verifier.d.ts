interface GetSourcesOptions {
    verifier?: string;
    httpApiEndpointV4?: string;
    testnet?: boolean;
}
export declare type FuncCompilerVersion = string;
export declare type TactVersion = string;
export declare type FiftVersion = FuncCompilerVersion;
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
};
export interface SourcesData {
    files: (TactSource | FuncSource)[];
    compiler: "func" | "tact" | "fift";
    compilerSettings: FuncCompilerSettings | FiftCliCompileSettings | TactCliCompileSettings;
    verificationDate: Date;
    ipfsHttpLink: string;
}
type IpfsUrlConverterFunc = (ipfsUrl: string, testnet: boolean) => string;
export declare const ContractVerifier: {
    getSourcesJsonUrl(codeCellHash: string, options?: GetSourcesOptions): Promise<string | null>;
    getSourcesData(sourcesJsonUrl: string, options?: {
        ipfsConverter?: IpfsUrlConverterFunc;
        testnet?: boolean;
    }): Promise<SourcesData>;
};
export {};
