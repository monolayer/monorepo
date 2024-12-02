import { kebabCase } from "case-anything";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { build } from "tsup";
import { tsupConfig } from "~workloads/make/tsup.js";
import type { WorkloadImport } from "~workloads/workloads/import.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";

export async function makeTask(taskImport: WorkloadImport<Task<unknown>>) {
	const workloadId = kebabCase(taskImport.workload.name);
	const dir = `tasks/${workloadId}`;

	const importPath = path.join(cwd(), taskImport.src.replace(".ts", ""));
	mkdirSync(`.workloads/${dir}`, { recursive: true });
	writeFileSync(`.workloads/${dir}/server.ts`, bullTemplate(importPath));
	writeFileSync(`.workloads/${dir}/lambda.ts`, lambdaTemplate(importPath));

	await build(
		tsupConfig(
			[`.workloads/${dir}/server.ts`, `.workloads/${dir}/lambda.ts`],
			`.workloads/${dir}`,
			[/(.*)/],
		),
	);

	return {
		path: dir,
		entryPoint: `index.mjs`,
	};
}

export const bullTemplate = (
	importPath: string,
) => `import { TaskBullWorker } from "${path.join(cwd(), "node_modules/@monolayer/workloads/dist/esm/workloads/stateless/task/workers/bull.js")}";
import task from "${importPath}.js";

new TaskBullWorker(task);
`;

export const lambdaTemplate = (
	importPath: string,
) => `import { doWorkWithSQS } from "${path.join(cwd(), "node_modules/@monolayer/workloads/dist/esm/workloads/stateless/task/workers/lambda.js")}";
import task from "${importPath}.js"

export const handler = doWorkWithSQS(task);
`;
