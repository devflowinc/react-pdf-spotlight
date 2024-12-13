const { build } = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

const doBuild = async () => {
  const reactBuild = await build({
    entryPoints: ["src/index.tsx"],
    treeShaking: true,
    outdir: "./dist",
    sourcemap: true,
    splitting: true,
    format: "esm",
    target: ["es2020"],
    plugins: [nodeExternalsPlugin()],
  });
};

doBuild();
