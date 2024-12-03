import { kebabCase } from "case-anything";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "tsup";
import { generateNode20Dockerfile } from "~workloads/make/dockerfile-node20.js";
import { tsupConfig } from "~workloads/make/tsup.js";
import type { WorkloadImport } from "~workloads/workloads/import.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";

export async function makeCron(cronImport: WorkloadImport<Cron>) {
	const dir = `crons/${kebabCase(cronImport.workload.id)}`;
	const parsed = path.parse(cronImport.src);

	await buildCron(cronImport, dir);

	const name = buildRunner(dir, parsed);
	buildDockerfile(parsed, dir);

	return {
		path: dir,
		entryPoint: name,
	};
}

async function buildCron(cronImport: WorkloadImport<Cron>, dir: string) {
	await build(tsupConfig([cronImport.src], `.workloads/${dir}`, [/(.*)/]));
}

function buildDockerfile(parsed: path.ParsedPath, dir: string) {
	const files = [
		path.format({
			root: `.workloads/${dir}/`,
			base: `${parsed.name}.js`,
			ext: ".js",
		}),
		path.format({
			root: `.workloads/${dir}/`,
			base: `${parsed.name}.js.map`,
			ext: ".js.map",
		}),
		path.format({
			root: `.workloads/${dir}/`,
			base: `index.mjs`,
			ext: ".mjs",
		}),
	];
	writeFileSync(
		path.join(`.workloads/${dir}`, `node20x.Dockerfile`),
		generateNode20Dockerfile(files),
	);
}

function buildRunner(dir: string, parsed: path.ParsedPath) {
	const name = `index.mjs`;
	writeFileSync(
		path.join(`.workloads/${dir}`, name),
		`\
import task from "./${parsed.name}.js";

await task.run();
`,
	);
	return name;
}
