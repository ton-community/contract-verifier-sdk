import { SourcesData } from "./contract-verifier";
declare type Theme = "light" | "dark";
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
export declare const ContractVerifierUI: {
    _stylesPopulated: {
        internal: boolean;
    };
    _populateStyle(theme: "dark" | "light"): void;
    _populateCode(contentSelector: string, theme: "dark" | "light"): void;
    _setCode({ name, content }: {
        name: string;
        content: string;
    }, codeWrapperEl: HTMLElement, filesListEl?: HTMLElement, fileEl?: HTMLElement): void;
    setCode(contentSelector: string, content: string): void;
    _populateFiles(fileListSelector: string, contentSelector: string, files: {
        name: string;
        content: string;
    }[], theme: "dark" | "light"): void;
    _populateContainer(selector: string, hideLineNumbers: boolean): void;
    loadSourcesData(sourcesData: SourcesData, opts: {
        containerSelector: string;
        fileListSelector?: string;
        contentSelector: string;
        theme: Theme;
        hideLineNumbers?: boolean;
    }): void;
};
export {};
