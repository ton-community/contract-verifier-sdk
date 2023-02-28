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
function defaultIpfsConverter(ipfs) {
    return ipfs.replace("ipfs://", "https://tonsource.infura-ipfs.io/ipfs/");
}
function bigIntFromBuffer(buffer) {
    return BigInt(`0x${buffer.toString("hex")}`);
}
exports.ContractVerifier = {
    async getSourcesJsonUrl(codeCellHash, options) {
        const tc = new ton_1.TonClient4({
            endpoint: options?.httpApiEndpointV4 ?? (await (0, ton_access_1.getHttpV4Endpoint)()),
        });
        const { last: { seqno }, } = await tc.getLastBlock();
        const args = new ton_1.TupleBuilder();
        args.writeNumber(bigIntFromBuffer(toSha256Buffer(options?.verifier ?? "orbs.com")));
        args.writeNumber(bigIntFromBuffer(Buffer.from(codeCellHash, "base64")));
        const { result: itemAddRes } = await tc.runMethod(seqno, SOURCES_REGISTRY, "get_source_item_address", args.build());
        let reader = new ton_1.TupleReader(itemAddRes);
        const sourceItemAddr = reader.readAddress();
        const acc = await tc.getAccount(seqno, sourceItemAddr);
        const isDeployed = acc.account.state.type === "active";
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
    async getSourcesData(sourcesJsonUrl, ipfsConverter) {
        ipfsConverter = ipfsConverter ?? defaultIpfsConverter;
        const ipfsHttpLink = ipfsConverter(sourcesJsonUrl);
        const verifiedContract = await (await fetch(ipfsConverter(sourcesJsonUrl))).json();
        let files = [];
        console.log(verifiedContract, "Shahar");
        if (verifiedContract.compiler === "tact") {
            const pkg = JSON.parse(await fetch(ipfsConverter(verifiedContract.sources[0].url)).then((u) => u.text()));
            files.push({
                name: pkg.name + ".abi",
                content: JSON.stringify(JSON.parse(pkg.abi), null, 3),
            });
            files.push({
                name: pkg.name + ".pkg",
                content: JSON.stringify(pkg, null, 3),
            });
            files.push(...Object.entries(pkg.sources).map(([fileName, content]) => {
                return {
                    name: fileName,
                    content: Buffer.from(content, "base64").toString("utf-8"),
                };
            }));
        }
        else {
            files = (await Promise.all(verifiedContract.sources.map(async (source) => {
                const url = ipfsConverter(source.url);
                const content = await fetch(url).then((u) => u.text());
                return {
                    name: source.filename,
                    content,
                    isEntrypoint: source.isEntrypoint,
                };
            })))
                .reverse()
                .sort((a, b) => {
                // if (a.type && b.type) {
                //   return Number(b.type === "code") - Number(a.type === "code");
                // }
                return Number(b.isEntrypoint) - Number(a.isEntrypoint);
            });
        }
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