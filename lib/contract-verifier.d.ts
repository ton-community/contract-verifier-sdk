interface GetSourcesOptions {
    verifier?: string;
    httpApiEndpoint?: string;
    httpApiKey?: string;
}
export declare type FuncCompilerVersion = "0.2.0" | "0.3.0";
export declare type TactVersion = "0.4.0";
export declare type FiftVersion = FuncCompilerVersion;
export declare type FuncCompilerSettings = {
    funcVersion: FuncCompilerVersion;
    commandLine: string;
};
export declare type FiftCliCompileSettings = {
    fiftVersion: FiftVersion;
    commandLine: string;
};
export declare type TactCliCompileSettings = {
    tactVersion: TactVersion;
};
export declare type FuncSource = {
    name: string;
    content: string;
    isEntrypoint: boolean;
};
export declare type TactSource = {
    name: string;
    content: string;
    type: "code" | "abi";
};
export interface SourcesData {
    files: (TactSource | FuncSource)[];
    compiler: "func" | "tact" | "fift";
    compilerSettings: FuncCompilerSettings | FiftCliCompileSettings | TactCliCompileSettings;
    verificationDate: Date;
    ipfsHttpLink: string;
}
declare type IpfsUrlConverterFunc = (ipfsUrl: string) => string;
export declare const ContractVerifier: {
    getSourcesJsonUrl: (codeCellHash: string, options?: GetSourcesOptions) => Promise<string | null>;
    getSourcesData: (sourcesJsonUrl: string, ipfsConverter?: IpfsUrlConverterFunc) => Promise<SourcesData>;
};
export {};
