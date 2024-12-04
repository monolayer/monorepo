import { kebabCase } from "case-anything";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "tsup";
import { tsupConfig } from "~workloads/beamer/blueprints/code/config.js";
import { generateNode20Dockerfile } from "~workloads/beamer/blueprints/docker/dockerfile-node20.js";
import type { WorkloadImport } from "~workloads/beamer/scan/workload-imports.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";

export async function makeTask(taskImport: WorkloadImport<Task<unknown>>) {
	const workloadId = kebabCase(taskImport.workload.name);
	const dir = `tasks/${workloadId}/dist`;
	const taskFileName = await buildTask(taskImport, dir);
	const workerFileName = await buildWorker(dir);
	const entryPointFilename = buildRunner(
		taskImport,
		dir,
		taskFileName,
		workerFileName,
	);

	buildDockerfile(
		[
			taskFileName,
			`${taskFileName}.map`,
			workerFileName,
			`${workerFileName}.map`,
			entryPointFilename,
		],
		dir,
	);
	return {
		path: dir,
		entryPoint: entryPointFilename,
	};
}

async function buildWorker(dir: string) {
	await build(
		tsupConfig(
			[
				"./node_modules/@monolayer/workloads/dist/esm/workloads/stateless/task/worker.js",
			],
			`.workloads/${dir}`,
			[/(.*)/],
			".cjs",
		),
	);
	return "worker.cjs";
}

async function buildTask(
	taskImport: WorkloadImport<Task<unknown>>,
	dir: string,
) {
	await build(
		tsupConfig([taskImport.src], `.workloads/${dir}`, [/(.*)/], ".cjs"),
	);
	return `${path.parse(taskImport.src).name}.cjs`;
}

export function buildRunner(
	taskImport: WorkloadImport<Task<unknown>>,
	dir: string,
	taskFileName: string,
	workerFileName: string,
) {
	const name = `index.mjs`;
	writeFileSync(
		path.join(`.workloads/${dir}`, name),
		`\
import { TaskWorker } from "./${workerFileName}";
import task from "./${taskFileName}";

new TaskWorker(task);
`,
	);
	return name;
}

function buildDockerfile(filenames: string[], dir: string) {
	const files = filenames.map((filename) =>
		path.format({
			root: `.workloads/${dir}/`,
			base: filename,
		}),
	);
	const dockerfile = generateNode20Dockerfile(files);
	dockerfile.save(path.join(`.workloads/${dir}`, "..", `node20x.Dockerfile`));
}
