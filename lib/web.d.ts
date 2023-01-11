import { ContractVerifier as _ContractVerifier, ContractVerifierUI as _ContractVerifierUI } from "./index";
declare global {
    var ContractVerifier: typeof _ContractVerifier;
    var ContractVerifierUI: typeof _ContractVerifierUI;
}
