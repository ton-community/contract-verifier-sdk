import { ContractVerifier as _ContractVerifier } from "./contract-verifier";
import { ContractVerifierUI as _ContractVerifierUI } from "./contract-verifier-ui";
declare global {
    var ContractVerifier: typeof _ContractVerifier;
    var ContractVerifierUI: typeof _ContractVerifierUI;
}
