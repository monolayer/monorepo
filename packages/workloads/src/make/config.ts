import type { Options } from "tsup";

export function tsupConfig(
	entry: string[] | Record<string, string>,
	outDir: string,
	noExternal: (string | RegExp)[],
	cjsExt: string = ".js",
) {
	const options: Options = {
		outExtension({ format }) {
			switch (format) {
				case "cjs":
					return {
						js: cjsExt,
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
		format: ["cjs"],
		entry,
		outDir,
		dts: false,
		shims: false,
		skipNodeModulesBundle: true,
		noExternal: [/monolayer/],
		clean: false,
		target: "node22",
		platform: "node",
		minify: false,
		splitting: false,
		treeshake: true,
		cjsInterop: false,
		sourcemap: true,
		silent: true,
	};
	return options;
}
