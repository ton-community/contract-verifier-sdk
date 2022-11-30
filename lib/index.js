var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Address, Cell, TonClient } from "ton";
import { BN } from "bn.js";
import { getHttpEndpoint } from "@orbs-network/ton-gateway";
import { Sha256 } from "@aws-crypto/sha256-js";
import hljs from "highlight.js/lib/core";
import hljsDefine from "highlightjs-func";
hljsDefine(hljs);
import style from "./style.css";
import { TreeFolder, TreeFile } from "./file-structure";
import { div } from "./dom";
const SOURCES_REGISTRY = "EQD-BJSVUJviud_Qv7Ymfd3qzXdrmV525e3YDzWQoHIAiInL";
function toSha256Buffer(s) {
    const sha = new Sha256();
    sha.update(s);
    return Buffer.from(sha.digestSync());
}
function defaultIpfsConverter(ipfs) {
    return ipfs.replace("ipfs://", "https://tonsource.infura-ipfs.io/ipfs/");
}
const _ContractVerifier = {
    getSourcesJsonUrl: function (codeCellHash, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const tc = new TonClient({
                endpoint: (_a = options === null || options === void 0 ? void 0 : options.httpApiEndpoint) !== null && _a !== void 0 ? _a : (yield getHttpEndpoint()),
                apiKey: options === null || options === void 0 ? void 0 : options.httpApiKey,
            });
            const { stack: sourceItemAddressStack } = yield tc.callGetMethod(Address.parse(SOURCES_REGISTRY), "get_source_item_address", [
                [
                    "num",
                    new BN(toSha256Buffer((_b = options === null || options === void 0 ? void 0 : options.verifier) !== null && _b !== void 0 ? _b : "orbs.com")).toString(),
                ],
                ["num", new BN(Buffer.from(codeCellHash, "base64")).toString(10)],
            ]);
            const sourceItemAddr = Cell.fromBoc(Buffer.from(sourceItemAddressStack[0][1].bytes, "base64"))[0]
                .beginParse()
                .readAddress();
            const isDeployed = yield tc.isContractDeployed(sourceItemAddr);
            if (isDeployed) {
                const { stack: sourceItemDataStack } = yield tc.callGetMethod(sourceItemAddr, "get_source_item_data");
                const contentCell = Cell.fromBoc(Buffer.from(sourceItemDataStack[3][1].bytes, "base64"))[0].beginParse();
                const version = contentCell.readUintNumber(8);
                if (version !== 1)
                    throw new Error("Unsupported version");
                const ipfsLink = contentCell.readRemainingBytes().toString();
                return ipfsLink;
            }
            return null;
        });
    },
    getSourcesData: function (sourcesJsonUrl, ipfsConverter) {
        return __awaiter(this, void 0, void 0, function* () {
            ipfsConverter = ipfsConverter !== null && ipfsConverter !== void 0 ? ipfsConverter : defaultIpfsConverter;
            const ipfsHttpLink = ipfsConverter(sourcesJsonUrl);
            const verifiedContract = yield (yield fetch(ipfsConverter(sourcesJsonUrl))).json();
            const files = (yield Promise.all(verifiedContract.sources.map((source) => __awaiter(this, void 0, void 0, function* () {
                const url = ipfsConverter(source.url);
                const content = yield fetch(url).then((u) => u.text());
                return {
                    name: source.filename,
                    content,
                    isEntrypoint: source.isEntrypoint,
                };
            }))))
                .reverse()
                .sort((a, b) => {
                return Number(b.isEntrypoint) - Number(a.isEntrypoint);
            });
            return {
                files: files,
                verificationDate: new Date(verifiedContract.verificationDate),
                compilerSettings: verifiedContract.compilerSettings,
                compiler: verifiedContract.compiler,
                ipfsHttpLink,
            };
        });
    },
};
export const classNames = {
    CONTAINER: "contract-verifier-container",
    FILES: "contract-verifier-files",
    FILE: "contract-verifier-file",
    FOLDER: "contract-verifier-folder",
    TREE_ITEM: "contract-verifier-tree-item",
    FOLDER_CONTAINER: "contract-verifier-folder-container",
    CONTENT: "contract-verifier-code",
    LINES: "contract-verifier-code-lines",
};
var _ContractVerifierUI = {
    _stylesPopulated: {
        internal: false,
    },
    _populateStyle: function (theme) {
        if (!this._stylesPopulated[theme]) {
            this._stylesPopulated[theme] = true;
            const styleEl = document.createElement("style");
            styleEl.innerHTML = `${theme === "light"
                ? require("highlight.js/styles/atom-one-light.css").toString()
                : require("highlight.js/styles/atom-one-dark.css").toString()}`;
            document.head.appendChild(styleEl);
        }
        if (!this._stylesPopulated.internal) {
            this._stylesPopulated.internal = true;
            const styleEl = document.createElement("style");
            styleEl.innerHTML = style;
            document.head.appendChild(styleEl);
        }
    },
    _populateCode: function (contentSelector, theme) {
        const codeContainer = document.querySelector(contentSelector);
        codeContainer.classList.add(classNames.CONTENT);
        codeContainer.innerHTML = `<pre><code class="language-func ${theme}"></code></pre>`;
    },
    _setCode: function ({ name, content }, codeWrapperEl, filesListEl, fileEl) {
        var _a;
        if (fileEl === null || fileEl === void 0 ? void 0 : fileEl.classList.contains("active"))
            return;
        codeWrapperEl.scrollTo(0, 0);
        content = content.trim();
        const codeEl = codeWrapperEl.querySelector("code");
        codeEl.innerHTML = "";
        codeEl.appendChild(div({ className: classNames.LINES }, content
            .split("\n")
            .map((_, i) => i + 1)
            .join("\n")));
        codeEl.appendChild(div({}, content));
        hljs.highlightElement(codeEl.children[codeEl.children.length - 1]);
        (_a = filesListEl === null || filesListEl === void 0 ? void 0 : filesListEl.querySelector(`.${classNames.FILE}.active`)) === null || _a === void 0 ? void 0 : _a.classList.remove("active");
        fileEl === null || fileEl === void 0 ? void 0 : fileEl.classList.add("active");
    },
    setCode: function (contentSelector, content) {
        this._setCode({ name: "", content }, document.querySelector(contentSelector));
    },
    _populateFiles: function (fileListSelector, contentSelector, files, theme) {
        const filePart = document.querySelector(fileListSelector);
        filePart.innerHTML = "";
        filePart.classList.add(theme);
        filePart.classList.add(classNames.FILES);
        // Prepare folder hierarchy
        const root = {
            type: "root",
            children: [],
        };
        files.forEach((file) => {
            const nameParts = Array.from(file.name.matchAll(/(?:\/|^)([^\/\n]+)/g)).map((m) => m[1]);
            const folders = nameParts.length > 1 ? nameParts.slice(0, nameParts.length - 1) : [];
            let levelToPushTo = root;
            folders.forEach((folder) => {
                let existingFolder = levelToPushTo.children.find((obj) => obj.type === "folder" && obj.name === folder);
                if (!existingFolder) {
                    const newLevel = {
                        type: "folder",
                        name: folder,
                        children: [],
                    };
                    levelToPushTo.children.push(newLevel);
                    existingFolder = newLevel;
                }
                levelToPushTo = existingFolder;
            });
            levelToPushTo.children.push({
                type: "file",
                name: nameParts[nameParts.length - 1],
                content: file.content,
            });
        });
        function processLevel(level) {
            return level.children
                .filter((obj) => obj.type === "file")
                .map((child) => {
                const file = TreeFile({ name: child.name }, theme);
                file.onclick = () => {
                    ContractVerifierUI._setCode({ name: child.name, content: child.content }, document.querySelector(contentSelector), document.querySelector(fileListSelector), file);
                };
                return file;
            })
                .concat(level.children
                .filter((obj) => obj.type === "folder")
                .map((child) => TreeFolder({ name: child.name, opened: true }, theme, ...processLevel(child))));
        }
        processLevel(root).forEach((el) => filePart.appendChild(el));
    },
    _populateContainer: function (selector, hideLineNumbers, layout) {
        const el = document.querySelector(selector);
        el.classList.add(classNames.CONTAINER);
        if (layout === "column") {
            el.classList.add("column");
        }
        if (!hideLineNumbers) {
            el.classList.add("lineNumbers");
        }
    },
    loadSourcesData: function (sourcesData, opts) {
        this._populateContainer(opts.containerSelector, !!opts.hideLineNumbers, opts.layout);
        if (opts.fileListSelector) {
            this._populateFiles(opts.fileListSelector, opts.contentSelector, sourcesData.files, opts.theme);
        }
        this._populateStyle(opts.theme);
        this._populateCode(opts.contentSelector, opts.theme);
        this._setCode(sourcesData.files[0], document.querySelector(opts.contentSelector), document.querySelector(opts.fileListSelector), document.querySelector(`${opts.fileListSelector} .contract-verifier-file`) // Get first file
        );
    },
};
window.ContractVerifier = _ContractVerifier;
window.ContractVerifierUI = _ContractVerifierUI;
//# sourceMappingURL=index.js.map