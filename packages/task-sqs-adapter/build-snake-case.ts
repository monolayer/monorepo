import * as esbuild from "esbuild";

async function build() {
	await esbuild.build({
		entryPoints: ["src/snake-case.ts"],
		bundle: true,
		outfile: "dist/cjs/snake-case.js",
		platform: "node",
		format: "cjs",
		treeShaking: true,
		external: [],
	});
	await esbuild.build({
		entryPoints: ["src/snake-case.ts"],
		bundle: true,
		outfile: "dist/esm/snake-case.js",
		platform: "node",
		format: "esm",
		treeShaking: true,
		external: [],
	});
}

build().catch((e) => console.error(e));
