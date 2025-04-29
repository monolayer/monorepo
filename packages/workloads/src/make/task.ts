import { kebabCase } from "case-anything";
import path from "path";
import { build } from "tsup";
import { tsupConfig } from "~workloads/make/config.js";
import type { TaskInfo } from "~workloads/make/manifest.js";
import { requiredFiles } from "~workloads/make/required-filtes.js";
import type { WorkloadImport } from "~workloads/scan/workload-imports.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";

export async function makeTask(taskImport: WorkloadImport<Task<unknown>>) {
	const workloadId = kebabCase(taskImport.workload.name);
	const dir = `tasks/${workloadId}`;
	const taskFileName = await buildTask(taskImport, dir);
	return {
		path: dir,
		entryPoint: taskFileName,
		dockerfileName: "none",
	};
}

async function buildTask(
	taskImport: WorkloadImport<Task<unknown>>,
	dir: string,
) {
	await build(
		tsupConfig(
			{ index: taskImport.src },
			`.workloads/${dir}`,
			[/(.*)/],
			".cjs",
		),
	);
	return "index.mjs";
}

export async function taskRequiredFiles(taskInfo: TaskInfo) {
	const taskPath = path.join(".workloads", taskInfo.path, taskInfo.entryPoint);
	await requiredFiles(taskPath);
}
