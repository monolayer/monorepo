import { kebabCase } from "case-anything";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "tsup";
import { tsupConfig } from "~workloads/make/config.js";
import { generateNode22Dockerfile } from "~workloads/make/dockerfiles/dockerfile-node22.js";
import { projectDependency } from "~workloads/scan/project.js";
import type { WorkloadImport } from "~workloads/scan/workload-imports.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";

export async function makeCron(cronImport: WorkloadImport<Cron>) {
	const dir = `crons/${kebabCase(cronImport.workload.id)}/dist`;
	const cronFileName = await buildCron(cronImport, dir);
	const runnerFileName = buildRunner(cronFileName, dir);

	buildDockerfile([cronFileName, `${cronFileName}.map`, runnerFileName], dir);

	return {
		path: dir,
		entryPoint: runnerFileName,
	};
}

async function buildCron(cronImport: WorkloadImport<Cron>, dir: string) {
	const ext = ".cjs";
	await build(tsupConfig([cronImport.src], `.workloads/${dir}`, [/(.*)/], ext));
	return `${path.parse(cronImport.src).name}${ext}`;
}

function buildDockerfile(files: string[], dir: string) {
	const dockerfile = generateNode22Dockerfile(
		files.map((file) =>
			path.format({
				root: `.workloads/${dir}/`,
				base: file,
			}),
		),
		{
			prisma: projectDependency("@prisma/client"),
		},
	);
	dockerfile.save(path.join(`.workloads/${dir}`, "..", `node22x.Dockerfile`));
}

function buildRunner(cronFileName: string, dir: string) {
	const name = `index.mjs`;
	writeFileSync(
		path.join(`.workloads/${dir}`, name),
		`\
import task from "./${cronFileName}";

await task.run();
`,
	);
	return name;
}
