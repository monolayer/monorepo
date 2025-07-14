import * as esbuild from "esbuild";

async function build() {
	await esbuild.build({
		entryPoints: [
			"./src/workloads/stateless/broadcast/server/broadcast-server.ts",
		],
		bundle: true,
		outfile: "dist/bin/broadcast-server.mjs",
		platform: "node",
		format: "esm",
		treeShaking: true,
		banner: {
			js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
		},
		minify: false,
	});
}

build().catch((e) => console.error(e));
