"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractVerifier = void 0;
const ton_1 = require("ton");
const ton_access_1 = require("@orbs-network/ton-access");
const sha256_js_1 = require("@aws-crypto/sha256-js");
const SOURCES_REGISTRY = "EQD-BJSVUJviud_Qv7Ymfd3qzXdrmV525e3YDzWQoHIAiInL";
function toSha256Buffer(s) {
    const sha = new sha256_js_1.Sha256();
    sha.update(s);
    return Buffer.from(sha.digestSync());
}
function defaultIpfsConverter(ipfs) {
    return ipfs.replace("ipfs://", "https://tonsource.infura-ipfs.io/ipfs/");
}
// https://github.com/ton-community/ton-core/pull/4
function tupleReaderSkip(t, num = 1) {
    for (let i = 0; i < num; i++) {
        t.pop();
    }
    return t;
}
////////////////////////////////////////////////////////////
exports.ContractVerifier = {
    async getSourcesJsonUrl(codeCellHash, options) {
        const tc = new ton_1.TonClient4({
            endpoint: options?.httpApiEndpoint ?? (await (0, ton_access_1.getHttpV4Endpoint)())
        });
        const latestBlock = await tc.getLastBlock();
        const seqno = latestBlock.last.seqno;
        const address = ton_1.Address.parse(SOURCES_REGISTRY);
        const p1 = {
            type: "int",
            value: BigInt(`0x${toSha256Buffer(options?.verifier ?? "orbs.com").toString("hex")}`)
        };
        const p2 = {
            type: "int",
            value: BigInt(`0x${Buffer.from(codeCellHash, "base64").toString("hex")}`)
        };
        const args = [p1, p2];
        //const { stack: sourceItemAddressStack } =
        const { result: itemAddRes } = await tc.runMethod(seqno, address, "get_source_item_address", args);
        let reader = new ton_1.TupleReader(itemAddRes);
        const sourceItemAddr = reader.readAddress();
        const acc = await tc.getAccount(seqno, sourceItemAddr);
        // is contract deployed
        const isDeployed = (acc.account.state.type === 'active');
        if (isDeployed) {
            //const stackRes = await tc.runMethod(seqno, address, "get_source_item_data", args);
            const { result: sourceItemDataRes } = await tc.runMethod(seqno, sourceItemAddr, "get_source_item_data");
            reader = new ton_1.TupleReader(sourceItemDataRes);
            const contentCell = tupleReaderSkip(reader, 3)
                .readCell()
                .beginParse();
            const version = contentCell.loadUint(8);
            if (version !== 1)
                throw new Error("Unsupported version");
            const ipfsLink = contentCell.loadStringTail();
            return ipfsLink;
        }
        return null;
    },
    async getSourcesData(sourcesJsonUrl, ipfsConverter) {
        ipfsConverter = ipfsConverter ?? defaultIpfsConverter;
        const ipfsHttpLink = ipfsConverter(sourcesJsonUrl);
        const verifiedContract = await (await fetch(ipfsConverter(sourcesJsonUrl))).json();
        const files = (await Promise.all(verifiedContract.sources.map(async (source) => {
            const url = ipfsConverter(source.url);
            const content = await fetch(url).then((u) => u.text());
            return {
                name: source.filename,
                content,
                isEntrypoint: source.isEntrypoint,
                type: source.type,
            };
        })))
            .reverse()
            .sort((a, b) => {
            if (a.type && b.type) {
                return Number(b.type === "code") - Number(a.type === "code");
            }
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