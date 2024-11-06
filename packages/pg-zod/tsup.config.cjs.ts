import { defineConfig } from "tsup";

export default defineConfig({
	format: ["cjs"],
	outDir: "dist/cjs",
	entry: ["./src/**/*.ts"],
	dts: true,
	shims: true,
	skipNodeModulesBundle: true,
	clean: true,
	target: "node18",
	platform: "node",
	minify: false,
	bundle: false,
	cjsInterop: true,
	sourcemap: false,
});
