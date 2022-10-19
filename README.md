# Ton Contract Verifier 

## Table of Contents

- Table of Contents
- TL;DR
- Getting Started
- License


## TL;DR
Ton verified contract code viewer for func with code highlighting 

## ⭐️ Features
- Fetches contract sources code from the ipfs via a sources.json url  
- Displays code navigator with code highlighting
- Customizable data fetching (IPFS GW, Ton API endpoint)

## 👀 Demo
1. Clone this repo
2. Run `npm install`
3. Run `npm build`
4. Navigate to `example/vanilla`
5. Run `npm link ../../`
6. Run `npm install`
7. Run `npm run dev`

## 📦 Getting Started

### Step 1: Prepare DOM ###
Add this to your HTML structure
```html
<div id="myVerifierContainer">
    <div id="myVerifierFiles">
    </div>
    <div id="myVerifierContent">
    </div>
</div>
```

### Step 2: Activate widget library

#### Node
(Coming soon)

#### Browser
```html
<script src="https://cdn.jsdelivr.net/gh/todo"></script>
<script>
    document.addEventListener("DOMContentLoaded", async function () {
        const codeCellHash = "/rX/aCDi/w2Ug+fg1iyBfYRniftK5YDIeIZtlZ2r1cA=";
        
        const ipfslink = await ContractVerifier.getSourcesJsonUrl(
            codeCellHash,
            { httpApiEndpoint: "https://scalable-api.tonwhales.com/jsonRPC" }
        );

        // means there exists a verified source for this contract
        if (ipfslink) {
            const sourcesData = await ContractVerifier.getSourcesData(ipfslink, (ipfs) => ipfs.replace("ipfs://", "https://myproj.mygateway-ipfs.io/ipfs/"));
            const theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

            ContractVerifierUI.loadSourcesData({
                sourcesData: sourcesData,
                containerSelector: "#myVerifierContainer",
                fileListSelector: "#myVerifierFiles",
                contentSelector: "#myVerifierContent",
                theme
            });
        }
    });
</script>
```

## ℹ️ Interface

### ContractVerifier
```typescript
interface GetSourcesOptions {
  verifier?: string, // Defaults to "orbs.com"
  httpApiEndpoint?: string, // Defaults to an Orbs L3 Ton Gateway
  httpApiKey?: string
}

// Returns an `ipfs://` prefixed URL if the given code cell hash has a corresponding source verifier contract 
async ContractVerifier.getSourcesJsonUrl(codeCellHash: string, options?: GetSourcesOptions): Promise<string | null>;


interface SourcesData {
  files: { name: string, content: string }[];
}
type IpfsUrlConverterFunc (ipfsUrl: string) => string;

// Returns file names and their source code content
async ContractVerifier.getSourcesData(sourcesJsonUrl: string | null, ipfsConverter?: IpfsUrlConverterFunc): Promise<SourcesData>;
```

### ContractVerifierUI

```typescript
ContractVerifierUI.loadSourcesData(sourcesData: SourcesData, opts: {
    containerSelector: string; // main container
    fileListSelector?: string; // if omitted, the file list will not be populated and the setCode function can be used instead to switch between files
    contentSelector: string; // code container
    theme: Theme; // "light" or "dark"
    layout?: Layout; // "row" or "column"
});

// To be used usually only if the file list is manually built
ContractVerifier.UI.setCode(contentSelector: string, content: string);
```

## 💎 Customization

### CSS
The widget will attach the following classnames to its components:
```
contract-verifier-container
contract-verifier-files
contract-verifier-file
contract-verifier-code
```

Which can be customized, for example in the following manner:
```css
#myContentFull code {
    background-color: var(--code-viewer-background);
    font-family: Ubuntu Mono,monospace; 
}
#myFilesFull .contract-verifier-file.active {
    background-color: var(--code-viewer-background);
}
#myFilesFull .contract-verifier-file.active {
    background-color: var(--code-viewer-background);
    color: var(--body-text-color); 
}
#myFilesFull .contract-verifier-file:hover {
    background-color: var(--code-viewer-tab-inactive-background);
    color: var(--body-text-color); 
}
#myFilesFull .contract-verifier-file {
    background-color: var(--code-viewer-tab-inactive-background);
    color: #666;
}
```

## 📔 License

MIT
