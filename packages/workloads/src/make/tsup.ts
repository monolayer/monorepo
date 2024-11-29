import type { Options } from "tsup";
export function tsupConfig(
	entry: string[],
	outDir: string,
	noExternal: (string | RegExp)[],
) {
	const options: Options = {
		outExtension({ format }) {
			switch (format) {
				case "cjs":
					return {
						js: `.js`,
					};
				case "iife":
					return {
						js: `.global.js`,
					};
				case "esm":
					return {
						js: `.mjs`,
					};
			}
		},
		format: ["cjs"],
		entry,
		outDir,
		dts: false,
		shims: true,
		skipNodeModulesBundle: false,
		clean: false,
		target: "node20",
		platform: "node",
		minify: false,
		bundle: true,
		noExternal,
		splitting: false,
		treeshake: true,
		cjsInterop: true,
		sourcemap: true,
		silent: false,
	};
	return options;
}
