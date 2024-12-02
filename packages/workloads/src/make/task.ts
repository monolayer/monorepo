import { kebabCase } from "case-anything";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "tsup";
import { tsupConfig } from "~workloads/make/tsup.js";
import type { WorkloadImport } from "~workloads/workloads/import.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";

export async function makeTask(taskImport: WorkloadImport<Task<unknown>>) {
	const workloadId = kebabCase(taskImport.workload.name);
	const dir = `tasks/${workloadId}`;

	mkdirSync(`.workloads/${dir}`, { recursive: true });

	const taskFileName = await buildTask(taskImport, dir);
	const workerFileName = await buildWorker(dir);
	const name = buildRunner(taskImport, dir, taskFileName, workerFileName);

	return {
		path: dir,
		entryPoint: name,
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
