import { defineConfig } from "tsup";

export default defineConfig({
	format: ["cjs"],
	entry: ["./src/handler/index.ts"],
	outDir: "dist/cjs/handler",
	outExtension({ format }) {
		switch (format) {
			case "cjs":
				return {
					js: ".cjs",
				};
			case "iife":
				return {
					js: ".global.js",
				};
			case "esm":
				return {
					js: ".mjs",
				};
		}
	},
	dts: true,
	shims: true,
	skipNodeModulesBundle: false,
	clean: true,
	target: "node22",
	platform: "node",
	minify: false,
	bundle: false,
	noExternal: [],
	splitting: false,
	cjsInterop: true,
	treeshake: true,
	sourcemap: false,
});
