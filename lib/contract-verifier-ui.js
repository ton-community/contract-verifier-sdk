"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractVerifierUI = exports.classNames = void 0;
const core_1 = __importDefault(require("highlight.js/lib/core"));
const highlightjs_func_1 = __importDefault(require("highlightjs-func"));
const dom_1 = require("./dom");
const file_structure_1 = require("./file-structure");
const style_css_1 = __importDefault(require("./style.css"));
(0, highlightjs_func_1.default)(core_1.default);
exports.classNames = {
    CONTAINER: "contract-verifier-container",
    FILES: "contract-verifier-files",
    FILE: "contract-verifier-file",
    FOLDER: "contract-verifier-folder",
    TREE_ITEM: "contract-verifier-tree-item",
    FOLDER_CONTAINER: "contract-verifier-folder-container",
    CODE_CONTAINER: "contract-verifier-code",
    CODE_LINES: "contract-verifier-code-lines",
    CODE_CONTENT: "contract-verifier-code-content",
};
exports.ContractVerifierUI = {
    _stylesPopulated: {
        internal: false,
    },
    _populateStyle(theme) {
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
            styleEl.innerHTML = style_css_1.default;
            document.head.appendChild(styleEl);
        }
    },
    _populateCode(contentSelector, theme) {
        const codeContainer = document.querySelector(contentSelector);
        codeContainer.classList.add(exports.classNames.CODE_CONTAINER);
        codeContainer.innerHTML = `<pre><code class="${theme}"></code></pre>`;
    },
    _setCode({ name, content }, codeWrapperEl, filesListEl, fileEl) {
        var _a;
        if (fileEl === null || fileEl === void 0 ? void 0 : fileEl.classList.contains("active"))
            return;
        codeWrapperEl.scrollTo(0, 0);
        content = content.trim();
        const codeEl = codeWrapperEl.querySelector("code");
        codeEl.innerHTML = "";
        codeEl.appendChild((0, dom_1.div)({ className: exports.classNames.CODE_LINES }, content
            .split("\n")
            .map((_, i) => i + 1)
            .join("\n")));
        const contentEl = (0, dom_1.div)({ className: exports.classNames.CODE_CONTENT }, content);
        codeEl.appendChild(contentEl);
        if (name.match(/\.fif(t)?$/)) {
            contentEl.classList.add("language-fift");
        }
        else {
            contentEl.classList.add("language-func");
        }
        core_1.default.highlightElement(contentEl);
        (_a = filesListEl === null || filesListEl === void 0 ? void 0 : filesListEl.querySelector(`.${exports.classNames.FILE}.active`)) === null || _a === void 0 ? void 0 : _a.classList.remove("active");
        fileEl === null || fileEl === void 0 ? void 0 : fileEl.classList.add("active");
    },
    setCode(contentSelector, content) {
        this._setCode({ name: "", content }, document.querySelector(contentSelector));
    },
    _populateFiles(fileListSelector, contentSelector, files, theme) {
        const filePart = document.querySelector(fileListSelector);
        filePart.innerHTML = "";
        filePart.classList.add(theme);
        filePart.classList.add(exports.classNames.FILES);
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
                const file = (0, file_structure_1.TreeFile)({ name: child.name }, theme);
                file.onclick = () => {
                    exports.ContractVerifierUI._setCode({ name: child.name, content: child.content }, document.querySelector(contentSelector), document.querySelector(fileListSelector), file);
                };
                return file;
            })
                .concat(level.children
                .filter((obj) => obj.type === "folder")
                .map((child) => (0, file_structure_1.TreeFolder)({ name: child.name, opened: true }, theme, ...processLevel(child))));
        }
        processLevel(root).forEach((el) => filePart.appendChild(el));
    },
    _populateContainer(selector, hideLineNumbers, layout) {
        const el = document.querySelector(selector);
        el.classList.add(exports.classNames.CONTAINER);
        if (layout === "column") {
            el.classList.add("column");
        }
        if (!hideLineNumbers) {
            el.classList.add("lineNumbers");
        }
    },
    loadSourcesData(sourcesData, opts) {
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
//# sourceMappingURL=contract-verifier-ui.js.map