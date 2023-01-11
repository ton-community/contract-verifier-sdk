let StyleLoader = {
  name: "inline-style",
  setup({ onLoad }) {
    let fs = require("fs");
    onLoad({ filter: /\.css$/ }, async (args) => {
      let css = await fs.promises.readFile(args.path, "utf8");
      return { contents: css, loader: "text" };
    });
  },
};

let SVGLoader = {
  name: "svg",
  setup({ onLoad }) {
    let fs = require("fs");
    onLoad({ filter: /\.svg$/ }, async (args) => {
      let svg = await fs.promises.readFile(args.path, "utf8");
      return { contents: svg, loader: "text" };
    });
  },
};

const { polyfillNode } = require("esbuild-plugin-polyfill-node");

(async () => {
  await require("esbuild")
    .build({
      plugins: [polyfillNode(), StyleLoader, SVGLoader],
      entryPoints: ["./src/lib/web.ts"],
      bundle: true,
      target: "ES2020",
      outfile: "./dist/index.min.js",
      sourcemap: true,
      minify: true,
    })
    .catch(() => process.exit(1));
})();
