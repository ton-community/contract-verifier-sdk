import { Address, Cell, TonClient } from "ton";
import { BN } from "bn.js";
import { getHttpEndpoint } from "@orbs-network/ton-gateway";
import { Sha256 } from "@aws-crypto/sha256-js";
import hljs from "highlight.js";
import hljsDefine from "highlightjs-func";
hljsDefine(hljs);

import style from "./style.css";

type Theme = "light" | "dark";
type Layout = "row" | "column";

interface GetSourcesOptions {
  verifier?: string;
  httpApiEndpoint?: string;
  httpApiKey?: string;
}

interface SourcesData {
  files: { name: string; content: string }[];
}

type IpfsUrlConverterFunc = (ipfsUrl: string) => string;

declare global {
  var ContractVerifier: typeof _ContractVerifier;
  var ContractVerifierUI: typeof _ContractVerifierUI;
}

const SOURCES_REGISTRY = "EQANJEwItCel0Pwle7fHaL1FRYC2dZyyzKCOqK2yjrMcxN-g";

function toSha256Buffer(s: string) {
  const sha = new Sha256();
  sha.update(s);
  return Buffer.from(sha.digestSync());
}

const _ContractVerifier = {
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
      const ipfsLink = Cell.fromBoc(
        Buffer.from(sourceItemDataStack[4][1].bytes, "base64")
      )[0]
        .beginParse()
        .readRemainingBytes()
        .toString();

      return ipfsLink;
    }

    return null;
  },

  getSourcesData: async function (
    sourcesJsonUrl: string,
    ipfsConverter?: IpfsUrlConverterFunc
  ): Promise<SourcesData> {
    ipfsConverter =
      ipfsConverter ??
      ((ipfs) =>
        ipfs.replace("ipfs://", "https://tonsource.infura-ipfs.io/ipfs/"));

    this.verifiedContract = await (
      await fetch(ipfsConverter(sourcesJsonUrl))
    ).json();

    // TODO filename => name
    const files = await Promise.all(
      this.verifiedContract.sources.map(
        async (source: { url: string; filename: string }) => {
          const url = ipfsConverter(source.url);
          const content = await fetch(url).then((u) => u.text());
          return {
            name: source.filename,
            content,
          };
        }
      )
    );

    return { files: files.reverse() };
  },
};

var _ContractVerifierUI = {
  classNames: {
    CONTAINER: "contract-verifier-container",
    FILES: "contract-verifier-files",
    FILE: "contract-verifier-file",
    CONTENT: "contract-verifier-code",
  },

  _populateCode: function (contentSelector: string, theme: "dark" | "light") {
    const codeContainer = document.querySelector(contentSelector);
    codeContainer.classList.add(this.classNames.CONTENT);
    const dark = require("highlight.js/styles/atom-one-dark.css").toString();
    const light = require("highlight.js/styles/atom-one-light.css").toString();

    const styleEl = document.createElement("style");
    styleEl.innerHTML = `${theme === "light" ? light : dark} ${style}`;
    document.head.appendChild(styleEl);

    codeContainer.innerHTML = `<pre><code class="language-func ${theme}"></code></pre>`;
  },

  _setCode: function (
    { name, content }: { name: string; content: string },
    codeWrapperEl: HTMLElement,
    filesListEl?: HTMLElement,
    fileEl?: HTMLElement
  ) {
    if (fileEl?.classList.contains("active")) return;
    codeWrapperEl.scrollTo(0, 0);
    const codeEl = codeWrapperEl.querySelector("code");
    codeEl.textContent = content;
    hljs.highlightElement(codeEl as HTMLElement);

    filesListEl
      ?.querySelector(`.${this.classNames.FILE}.active`)
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
    filePart.classList.add(theme);
    filePart.classList.add(this.classNames.FILES);

    files.forEach(({ name, content }) => {
      const el = document.createElement("div");
      el.classList.add(this.classNames.FILE);
      el.innerText = name;
      el.onclick = () => {
        this._setCode(
          { name, content },
          document.querySelector(contentSelector),
          document.querySelector(fileListSelector),
          el
        );
      };
      filePart.appendChild(el);
    });
  },

  _populateContainer: function (selector: string, layout?: "row" | "column") {
    const el = document.querySelector(selector);
    el.classList.add(this.classNames.CONTAINER);
    if (layout === "column") {
      el.classList.add("column");
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
    }
  ) {
    this._populateContainer(opts.containerSelector, opts.layout);

    if (opts.fileListSelector) {
      this._populateFiles(
        opts.fileListSelector,
        opts.contentSelector,
        sourcesData.files,
        opts.theme
      );
    }
    this._populateCode(opts.contentSelector, opts.theme);
    this._setCode(
      sourcesData.files[0],
      document.querySelector(opts.contentSelector),
      document.querySelector(opts.fileListSelector),
      document.querySelector(`${opts.fileListSelector} .contract-verifier-file`) // Get first file
    );
  },
};

window.ContractVerifier = _ContractVerifier;
window.ContractVerifierUI = _ContractVerifierUI;
