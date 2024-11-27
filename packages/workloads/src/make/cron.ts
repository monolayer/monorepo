import { kebabCase } from "case-anything";
import path from "node:path";
import { build } from "tsup";
import type { WorkloadImport } from "~workloads/workloads/import.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";

export async function makeCron(cronImport: WorkloadImport<Cron>) {
	const dir = `crons/${kebabCase(cronImport.workload.id)}`;
	await build({
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
		format: ["esm"],
		entry: [cronImport.src],
		outDir: `.workloads/${dir}`,
		dts: false,
		shims: false,
		skipNodeModulesBundle: false,
		clean: true,
		target: "node20",
		platform: "node",
		minify: false,
		bundle: true,
		noExternal: [],
		splitting: true,
		cjsInterop: true,
		treeshake: true,
		sourcemap: true,
		silent: true,
	});
	return {
		path: dir,
		entryPoint: `${path.parse(cronImport.src).name}.mjs`,
	};
}
