declare type Theme = "light" | "dark";
declare type Layout = "row" | "column";
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
export declare const classNames: {
    CONTAINER: string;
    FILES: string;
    FILE: string;
    FOLDER: string;
    TREE_ITEM: string;
    FOLDER_CONTAINER: string;
    CODE_CONTAINER: string;
    CODE_LINES: string;
    CODE_CONTENT: string;
};
export declare const ContractVerifier: {
    getSourcesJsonUrl: (codeCellHash: string, options?: GetSourcesOptions) => Promise<string | null>;
    getSourcesData: (sourcesJsonUrl: string, ipfsConverter?: IpfsUrlConverterFunc) => Promise<SourcesData>;
};
export declare const ContractVerifierUI: {
    _stylesPopulated: {
        internal: boolean;
    };
    _populateStyle: (theme: "dark" | "light") => void;
    _populateCode: (contentSelector: string, theme: "dark" | "light") => void;
    _setCode: ({ name, content }: {
        name: string;
        content: string;
    }, codeWrapperEl: HTMLElement, filesListEl?: HTMLElement, fileEl?: HTMLElement) => void;
    setCode: (contentSelector: string, content: string) => void;
    _populateFiles: (fileListSelector: string, contentSelector: string, files: {
        name: string;
        content: string;
    }[], theme: "dark" | "light") => void;
    _populateContainer: (selector: string, hideLineNumbers: boolean, layout?: "row" | "column") => void;
    loadSourcesData: (sourcesData: SourcesData, opts: {
        containerSelector: string;
        fileListSelector?: string;
        contentSelector: string;
        theme: Theme;
        layout?: Layout;
        hideLineNumbers?: boolean;
    }) => void;
};
export {};
