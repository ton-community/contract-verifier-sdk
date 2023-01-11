"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractVerifier = void 0;
const ton_1 = require("ton");
const bn_js_1 = require("bn.js");
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
exports.ContractVerifier = {
    getSourcesJsonUrl(codeCellHash, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const tc = new ton_1.TonClient({
                endpoint: (_a = options === null || options === void 0 ? void 0 : options.httpApiEndpoint) !== null && _a !== void 0 ? _a : (yield (0, ton_access_1.getHttpEndpoint)()),
                apiKey: options === null || options === void 0 ? void 0 : options.httpApiKey,
            });
            const { stack: sourceItemAddressStack } = yield tc.callGetMethod(ton_1.Address.parse(SOURCES_REGISTRY), "get_source_item_address", [
                [
                    "num",
                    new bn_js_1.BN(toSha256Buffer((_b = options === null || options === void 0 ? void 0 : options.verifier) !== null && _b !== void 0 ? _b : "orbs.com")).toString(),
                ],
                ["num", new bn_js_1.BN(Buffer.from(codeCellHash, "base64")).toString(10)],
            ]);
            const sourceItemAddr = ton_1.Cell.fromBoc(Buffer.from(sourceItemAddressStack[0][1].bytes, "base64"))[0]
                .beginParse()
                .readAddress();
            const isDeployed = yield tc.isContractDeployed(sourceItemAddr);
            if (isDeployed) {
                const { stack: sourceItemDataStack } = yield tc.callGetMethod(sourceItemAddr, "get_source_item_data");
                const contentCell = ton_1.Cell.fromBoc(Buffer.from(sourceItemDataStack[3][1].bytes, "base64"))[0].beginParse();
                const version = contentCell.readUintNumber(8);
                if (version !== 1)
                    throw new Error("Unsupported version");
                const ipfsLink = contentCell.readRemainingBytes().toString();
                return ipfsLink;
            }
            return null;
        });
    },
    getSourcesData(sourcesJsonUrl, ipfsConverter) {
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
                    type: source.type,
                };
            }))))
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
        });
    },
};
//# sourceMappingURL=contract-verifier.js.map