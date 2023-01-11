import hljs from "highlight.js/lib/core";
import hljsDefine from "highlightjs-func";
import { SourcesData } from "./contract-verifier";
import { div } from "./dom";
import { TreeFile, TreeFolder } from "./file-structure";
import style from "./style.css";

hljsDefine(hljs);

type Theme = "light" | "dark";
type Layout = "row" | "column";

export const classNames = {
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

export const ContractVerifierUI = {
  _stylesPopulated: {
    internal: false,
  },
  _populateStyle: function (theme: "dark" | "light") {
    if (!this._stylesPopulated[theme]) {
      this._stylesPopulated[theme] = true;
      const styleEl = document.createElement("style");
      styleEl.innerHTML = `${
        theme === "light"
          ? require("highlight.js/styles/atom-one-light.css").toString()
          : require("highlight.js/styles/atom-one-dark.css").toString()
      }`;
      document.head.appendChild(styleEl);
    }
    if (!this._stylesPopulated.internal) {
      this._stylesPopulated.internal = true;
      const styleEl = document.createElement("style");
      styleEl.innerHTML = style;
      document.head.appendChild(styleEl);
    }
  },
  _populateCode: function (contentSelector: string, theme: "dark" | "light") {
    const codeContainer = document.querySelector(contentSelector);
    codeContainer.classList.add(classNames.CODE_CONTAINER);
    codeContainer.innerHTML = `<pre><code class="${theme}"></code></pre>`;
  },

  _setCode: function (
    { name, content }: { name: string; content: string },
    codeWrapperEl: HTMLElement,
    filesListEl?: HTMLElement,
    fileEl?: HTMLElement
  ) {
    if (fileEl?.classList.contains("active")) return;
    codeWrapperEl.scrollTo(0, 0);
    content = content.trim();
    const codeEl = codeWrapperEl.querySelector("code");
    codeEl.innerHTML = "";
    codeEl.appendChild(
      div(
        { className: classNames.CODE_LINES },
        content
          .split("\n")
          .map((_, i) => i + 1)
          .join("\n")
      )
    );

    const contentEl = div({ className: classNames.CODE_CONTENT }, content);
    codeEl.appendChild(contentEl);

    if (name.match(/\.fif(t)?$/)) {
      contentEl.classList.add("language-fift");
    } else {
      contentEl.classList.add("language-func");
    }

    hljs.highlightElement(contentEl);

    filesListEl
      ?.querySelector(`.${classNames.FILE}.active`)
      ?.classList.remove("active");

    fileEl?.classList.add("active");
  },

  setCode: function (contentSelector: string, content: string) {
    this._setCode(
      { name: "", content },
      document.querySelector(contentSelector)
    );
  },

  _populateFiles: function (
    fileListSelector: string,
    contentSelector: string,
    files: { name: string; content: string }[],
    theme: "dark" | "light"
  ) {
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
      const nameParts = Array.from(
        file.name.matchAll(/(?:\/|^)([^\/\n]+)/g)
      ).map((m) => m[1]);

      const folders =
        nameParts.length > 1 ? nameParts.slice(0, nameParts.length - 1) : [];

      let levelToPushTo = root;

      folders.forEach((folder) => {
        let existingFolder = levelToPushTo.children.find(
          (obj) => obj.type === "folder" && obj.name === folder
        );

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
            ContractVerifierUI._setCode(
              { name: child.name, content: child.content },
              document.querySelector(contentSelector),
              document.querySelector(fileListSelector),
              file
            );
          };
          return file;
        })
        .concat(
          level.children
            .filter((obj) => obj.type === "folder")
            .map((child) =>
              TreeFolder(
                { name: child.name, opened: true },
                theme,
                ...processLevel(child)
              )
            )
        );
    }

    processLevel(root).forEach((el) => filePart.appendChild(el));
  },

  _populateContainer: function (
    selector: string,
    hideLineNumbers: boolean,
    layout?: "row" | "column"
  ) {
    const el = document.querySelector(selector);
    el.classList.add(classNames.CONTAINER);
    if (layout === "column") {
      el.classList.add("column");
    }
    if (!hideLineNumbers) {
      el.classList.add("lineNumbers");
    }
  },

  loadSourcesData: function (
    sourcesData: SourcesData,
    opts: {
      containerSelector: string;
      fileListSelector?: string;
      contentSelector: string;
      theme: Theme;
      layout?: Layout;
      hideLineNumbers?: boolean;
    }
  ) {
    this._populateContainer(
      opts.containerSelector,
      !!opts.hideLineNumbers,
      opts.layout
    );

    if (opts.fileListSelector) {
      this._populateFiles(
        opts.fileListSelector,
        opts.contentSelector,
        sourcesData.files,
        opts.theme
      );
    }
    this._populateStyle(opts.theme);
    this._populateCode(opts.contentSelector, opts.theme);
    this._setCode(
      sourcesData.files[0],
      document.querySelector(opts.contentSelector),
      document.querySelector(opts.fileListSelector),
      document.querySelector(`${opts.fileListSelector} .contract-verifier-file`) // Get first file
    );
  },
};
