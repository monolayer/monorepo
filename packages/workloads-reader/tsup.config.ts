import { defineConfig } from "tsup";

export default defineConfig({
	format: ["esm"],
	entry: ["./src/reader.ts"],
	outDir: "dist",
	dts: false,
	shims: true,
	skipNodeModulesBundle: false,
	clean: true,
	target: "node20",
	platform: "node",
	minify: false,
	bundle: true,
	noExternal: [],
	splitting: false,
	cjsInterop: true,
	treeshake: true,
	sourcemap: false,
});
