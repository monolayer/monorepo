import { defineConfig } from "tsup";

export default defineConfig({
	format: ["esm"],
	outDir: "dist/esm",
	entry: ["./src/**/*.ts"],
	dts: true,
	skipNodeModulesBundle: true,
	clean: true,
	target: "node20",
	platform: "node",
	minify: false,
	bundle: false,
	sourcemap: false,
});
