import * as esbuild from "esbuild";

async function build() {
	await esbuild.build({
		entryPoints: ["adapter/index.mjs"],
		bundle: true,
		outfile: "dist/adapter/index.mjs",
		platform: "node",
		format: "esm",
		treeShaking: true,
		banner: {
			js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
		},
		external: [
			"@aws-sdk/client-dynamodb",
			"@aws-sdk/client-s3",
			"@aws-sdk/util-utf8-node",
			"next/dist/server/response-cache/index.js",
			"next",
		],
	});
}

build().catch((e) => console.error(e));
