import { defineConfig } from "tsup";

export default defineConfig({
	format: ["esm"],
	entry: ["./src/bin/cli.ts"],
	outDir: "dist/bin",
	banner: {
		js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
	},
	dts: false,
	shims: false,
	skipNodeModulesBundle: false,
	clean: false,
	target: "node20",
	platform: "node",
	minify: false,
	bundle: true,
	noExternal: [],
	splitting: true,
	cjsInterop: true,
	treeshake: true,
	sourcemap: false,
});
