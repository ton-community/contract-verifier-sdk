import { ContractVerifier } from "@ton-community/contract-verifier-sdk";

(async () => {
  console.log("Fetching IPFS Link")
  const ipfsLink = await ContractVerifier.getSourcesJsonUrl(
    "45cE5NYJuT5l2bJ+HfRI0hUhR3LsBI6wER6yralqPyY="
  );

  console.log(`Got: ${ipfsLink}. Fetching JSON and sources.\n`)

  const src = await ContractVerifier.getSourcesData(ipfsLink!);

  console.log({
    ...src,
    files: src.files.map(({ name, content }) => ({
      name,
      content: content.slice(0, 50) + "...",
    })),
  });
})();
