declare type Theme = "light" | "dark";
declare type Layout = "row" | "column";
interface GetSourcesOptions {
    verifier?: string;
    httpApiEndpoint?: string;
    httpApiKey?: string;
}
export declare type FuncCompilerVersion = "0.2.0" | "0.3.0";
export declare type FuncCompilerSettings = {
    funcVersion: FuncCompilerVersion;
    commandLine: string;
    fiftVersion: string;
    fiftlibVersion: string;
};
export interface SourcesData {
    files: {
        name: string;
        content: string;
        isEntrypoint: boolean;
    }[];
    compiler: string;
    compilerSettings: FuncCompilerSettings;
    verificationDate: Date;
}
declare type IpfsUrlConverterFunc = (ipfsUrl: string) => string;
declare global {
    var ContractVerifier: typeof _ContractVerifier;
    var ContractVerifierUI: typeof _ContractVerifierUI;
}
declare const _ContractVerifier: {
    getSourcesJsonUrl: (codeCellHash: string, options?: GetSourcesOptions) => Promise<string | null>;
    defaultIpfsConverter(ipfs: string): string;
    getSourcesData: (sourcesJsonUrl: string, ipfsConverter?: IpfsUrlConverterFunc) => Promise<SourcesData>;
};
export declare const classNames: {
    CONTAINER: string;
    FILES: string;
    FILE: string;
    FOLDER: string;
    TREE_ITEM: string;
    FOLDER_CONTAINER: string;
    CONTENT: string;
    LINES: string;
};
declare var _ContractVerifierUI: {
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
