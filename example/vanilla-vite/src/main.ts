import "./style.css";

import "@ton-community/contract-verifier-sdk";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Code Verifier UI Demo</h1>

    <h2>Full</h2>
    <div id="myContainerFull" style="height:500px; background-color:#282c34; width:100%;">
      <div id="myFilesFull">
      </div>
      <div id="myContentFull">
      </div>
    </div>
    
    <h2>No line numbers</h2>
    <div id="myContainerNoLineNum" style="height:500px; background-color:#282c34; width:100%;">
      <div id="myFilesNoLineNum">
      </div>
      <div id="myContentNoLineNum">
      </div>
    </div>
    
    <h2>No Files</h2>
    <div id="myContainerNoFiles" style="height:500px; background-color:#282c34; width:100%; margin-bottom: 8px;">
      <div id="myContentNoFiles">
      </div>
    </div>
    <button id="container-nofiles-btn">Switch file</button>

    <h2>With Explanation</h2>
    <div id="myContainerExplanation" style="height:500px; background-color:#282c34; width:100%;">
      <div id="myFilesExplanation">
      </div>
      <div id="myContentExplanation">
      </div>
      <div id="explanation" style="visibility: hidden;">
        <h3>How is this source code verified?</h3>
        <br/>
        This source code compiles to the same exact bytecode that is found on-chain.
        <br/>
        <br/>
        Compilation verification is performed by a decentralized group of validators.
        <br/>
        <br/>
        Variable names and comments cannot be verified and may not be honest.
        <br/>
        <br/>
        <button>See proof</button>
      </div>
    </div>

  </div>
`;

window.onload = async () => {
  const ipfslink = await ContractVerifier.getSourcesJsonUrl(
    "E/XXoxbG124QU+iKxZtd5loHKjiEUTcdxcW+y7oT9Q4="
    // "/rX/aCDi/w2Ug+fg1iyBfYRniftK5YDIeIZtlZ2r1cA="
    // "p6Jhak1jmgdsL2fnzOBCP9Khwu5VCtZRwe2hbuE7yso="
    // { httpApiEndpoint: "https://scalable-api.tonwhales.com/jsonRPC" }
  );

  if (ipfslink) {
    const sourcesData = await ContractVerifier.getSourcesData(ipfslink);

    const theme =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    // Full
    ContractVerifierUI.loadSourcesData(sourcesData, {
      containerSelector: "#myContainerFull",
      fileListSelector: "#myFilesFull",
      contentSelector: "#myContentFull",
      theme,
    });

    // No line num
    ContractVerifierUI.loadSourcesData(sourcesData, {
      containerSelector: "#myContainerNoLineNum",
      fileListSelector: "#myFilesNoLineNum",
      contentSelector: "#myContentNoLineNum",
      theme,
      hideLineNumbers: true,
    });

    // No files
    ContractVerifierUI.loadSourcesData(sourcesData, {
      containerSelector: "#myContainerNoFiles",
      contentSelector: "#myContentNoFiles",
      theme,
    });

    (document.querySelector("#container-nofiles-btn")! as HTMLElement).onclick =
      () => {
        ContractVerifierUI.setCode(
          "#myContentNoFiles",
          sourcesData.files[1].content
        );
      };

    // Explanation
    ContractVerifierUI.loadSourcesData(sourcesData, {
      containerSelector: "#myContainerExplanation",
      fileListSelector: "#myFilesExplanation",
      contentSelector: "#myContentExplanation",
      theme,
    });

    (document.querySelector("#explanation") as HTMLElement).style.visibility =
      "";
  }
};
