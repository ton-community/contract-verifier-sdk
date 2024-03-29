import { ContractVerifier as _ContractVerifier } from "./contract-verifier";
import { ContractVerifierUI as _ContractVerifierUI } from "./contract-verifier-ui";

declare global {
  var ContractVerifier: typeof _ContractVerifier;
  var ContractVerifierUI: typeof _ContractVerifierUI;
}

window.ContractVerifier = _ContractVerifier;
window.ContractVerifierUI = _ContractVerifierUI;

export { ContractVerifierUI } from "./contract-verifier-ui";
export * from "./contract-verifier";
