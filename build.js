let StyleLoader = {
  name: "inline-style",
  setup({ onLoad }) {
    let fs = require("fs");
    onLoad({ filter: /\.css$/ }, async (args) => {
      let css = await fs.promises.readFile(args.path, "utf8");
      return { contents: css, loader: 'text' };
    });
  },
};

const { nodePolyfills } = require("esbuild-plugin-polyfill-node");

(async () => {
  await require("esbuild")
    .build({
      plugins: [nodePolyfills(), StyleLoader],
      entryPoints: ["./src/lib/index.ts"],
      bundle: true,
      target: "es2015",
      outfile: "./build/index.js",
      sourcemap: true,
    })
    .catch(() => process.exit(1));
})();
