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
		format: ["esm"],
		banner: {
			js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
		},
		entry,
		outDir,
		dts: false,
		shims: true,
		skipNodeModulesBundle: true,
		noExternal: undefined,
		bundle: true,
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
