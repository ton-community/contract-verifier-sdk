"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractVerifier = void 0;
const ton_1 = require("@ton/ton");
const core_1 = require("@ton/core");
const sha256_js_1 = require("@aws-crypto/sha256-js");
const SOURCES_REGISTRY = core_1.Address.parse("EQD-BJSVUJviud_Qv7Ymfd3qzXdrmV525e3YDzWQoHIAiInL");
const SOURCES_REGISTRY_TESTNET = core_1.Address.parse("EQCsdKYwUaXkgJkz2l0ol6qT_WxeRbE_wBCwnEybmR0u5TO8");
function toSha256Buffer(s) {
    const sha = new sha256_js_1.Sha256();
    sha.update(s);
    return Buffer.from(sha.digestSync());
}
function defaultIpfsConverter(ipfs, testnet) {
    let endpoint;
    if (testnet) {
        endpoint = "https://tonsource-testnet.infura-ipfs.io/ipfs/";
    }
    else {
        endpoint = "https://files.orbs.network/ipfs/";
    }
    return ipfs.replace("ipfs://", endpoint);
}
function bigIntFromBuffer(buffer) {
    return BigInt(`0x${buffer.toString("hex")}`);
}
async function getSourceItemAddress(tc, seqno, sourceRegistryAddr, codeCellHash, verifier) {
    const args = new core_1.TupleBuilder();
    args.writeNumber(bigIntFromBuffer(toSha256Buffer(verifier)));
    args.writeNumber(bigIntFromBuffer(Buffer.from(codeCellHash, "base64")));
    const { result: itemAddRes } = await tc.runMethod(seqno, sourceRegistryAddr, "get_source_item_address", args.build());
    const reader = new core_1.TupleReader(itemAddRes);
    const sourceItemAddr = reader.readAddress();
    return sourceItemAddr;
}
async function getSourceItemData(tc, seqno, sourceItemAddr) {
    const { result: sourceItemDataRes } = await tc.runMethod(seqno, sourceItemAddr, "get_source_item_data");
    const reader = new core_1.TupleReader(sourceItemDataRes);
    const contentCell = reader.skip(3).readCell().beginParse();
    const version = contentCell.loadUint(8);
    if (version !== 1)
        throw new Error("Unsupported version");
    const ipfsLink = contentCell.loadStringTail();
    return ipfsLink;
}
function getDefaultClient(isTestnet) {
    return new ton_1.TonClient4({
        endpoint: (isTestnet
            ? "https://testnet.toncenter.com/api/v2/jsonRPC"
            : "https://toncenter.com/api/v2/jsonRPC"),
    });
}
exports.ContractVerifier = {
    async getSourcesJsonUrl(codeCellHash, options) {
        const tc = options?.tonClient ?? getDefaultClient(options.testnet ?? false);
        const { last: { seqno }, } = await tc.getLastBlock();
        const verifiers = options.verifiers ?? ["orbs.com", "verifier.ton.org"];
        const sourceRegistryAddr = options.testnet ? SOURCES_REGISTRY_TESTNET : SOURCES_REGISTRY;
        async function getSourceItemDataForVerifier(verifier) {
            const sourceItemAddr = await getSourceItemAddress(tc, seqno, sourceRegistryAddr, codeCellHash, verifier);
            const isDeployed = await tc.isContractDeployed(seqno, sourceItemAddr);
            if (isDeployed) {
                return [verifier, await getSourceItemData(tc, seqno, sourceItemAddr)];
            }
            return [verifier, null];
        }
        return new Map(await Promise.all(verifiers.map(getSourceItemDataForVerifier)));
    },
    async getSourcesData(sourcesJsonUrl, options) {
        const ipfsConverter = options.ipfsConverter ?? defaultIpfsConverter;
        const ipfsHttpLink = ipfsConverter(sourcesJsonUrl, !!options.testnet);
        const response = await fetch(ipfsConverter(sourcesJsonUrl, !!options.testnet));
        if (response.status >= 400) {
            throw new Error(await response.text());
        }
        const verifiedContract = await response.json();
        const files = (await Promise.all(verifiedContract.sources.map(async (source) => {
            const url = ipfsConverter(source.url, !!options.testnet);
            const resp = await fetch(url);
            if (resp.status >= 400) {
                return {
                    name: source.filename,
                    isEntrypoint: source.isEntrypoint,
                    error: await resp.text(),
                };
            }
            const content = await resp.text();
            return {
                name: source.filename,
                isEntrypoint: source.isEntrypoint,
                content,
            };
        })))
            .reverse()
            .sort((a, b) => {
            return Number(b.isEntrypoint) - Number(a.isEntrypoint);
        });
        return {
            files,
            verificationDate: new Date(verifiedContract.verificationDate),
            compilerSettings: verifiedContract.compilerSettings,
            compiler: verifiedContract.compiler,
            ipfsHttpLink,
        };
    },
};
//# sourceMappingURL=contract-verifier.js.map