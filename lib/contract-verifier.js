"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractVerifier = void 0;
const ton_1 = require("ton");
const ton_access_1 = require("@orbs-network/ton-access");
const sha256_js_1 = require("@aws-crypto/sha256-js");
const SOURCES_REGISTRY = ton_1.Address.parse("EQD-BJSVUJviud_Qv7Ymfd3qzXdrmV525e3YDzWQoHIAiInL");
function toSha256Buffer(s) {
    const sha = new sha256_js_1.Sha256();
    sha.update(s);
    return Buffer.from(sha.digestSync());
}
function defaultIpfsConverter(ipfs, testnet) {
    return ipfs.replace("ipfs://", `https://tonsource${testnet ? "-testnet" : ""}.infura-ipfs.io/ipfs/`);
}
function bigIntFromBuffer(buffer) {
    return BigInt(`0x${buffer.toString("hex")}`);
}
exports.ContractVerifier = {
    async getSourcesJsonUrl(codeCellHash, options) {
        const tc = new ton_1.TonClient4({
            endpoint: options?.httpApiEndpointV4 ??
                (await (0, ton_access_1.getHttpV4Endpoint)({
                    network: options.testnet ? "testnet" : "mainnet",
                })),
        });
        const { last: { seqno }, } = await tc.getLastBlock();
        const args = new ton_1.TupleBuilder();
        args.writeNumber(bigIntFromBuffer(toSha256Buffer(options?.verifier ?? "orbs.com")));
        args.writeNumber(bigIntFromBuffer(Buffer.from(codeCellHash, "base64")));
        const { result: itemAddRes } = await tc.runMethod(seqno, SOURCES_REGISTRY, "get_source_item_address", args.build());
        let reader = new ton_1.TupleReader(itemAddRes);
        const sourceItemAddr = reader.readAddress();
        const isDeployed = await tc.isContractDeployed(seqno, sourceItemAddr);
        if (isDeployed) {
            const { result: sourceItemDataRes } = await tc.runMethod(seqno, sourceItemAddr, "get_source_item_data");
            reader = new ton_1.TupleReader(sourceItemDataRes);
            const contentCell = reader.skip(3).readCell().beginParse();
            const version = contentCell.loadUint(8);
            if (version !== 1)
                throw new Error("Unsupported version");
            const ipfsLink = contentCell.loadStringTail();
            return ipfsLink;
        }
        return null;
    },
    async getSourcesData(sourcesJsonUrl, options) {
        const ipfsConverter = options.ipfsConverter ?? defaultIpfsConverter;
        const ipfsHttpLink = ipfsConverter(sourcesJsonUrl, !!options.testnet);
        const verifiedContract = await (await fetch(ipfsConverter(sourcesJsonUrl, !!options.testnet))).json();
        const files = (await Promise.all(verifiedContract.sources.map(async (source) => {
            const url = ipfsConverter(source.url, !!options.testnet);
            const content = await fetch(url).then((u) => u.text());
            return {
                name: source.filename,
                content,
                isEntrypoint: source.isEntrypoint,
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