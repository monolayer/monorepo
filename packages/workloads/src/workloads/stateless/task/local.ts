import { randomUUID } from "node:crypto";
import {
	performNow,
	type ExecutionId,
} from "~workloads/workloads/stateless/task/perform-now.js";
import type {
	PerformOptions,
	Task,
} from "~workloads/workloads/stateless/task/task.js";

export async function localDispatch<P>(
	task: Task<P>,
	data: P | P[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	options?: PerformOptions,
) {
	if (Array.isArray(data)) {
		const executionId: string[] = [];
		for (const single of data) {
			await performNow(task, single);
			executionId.push(randomUUID());
		}
		return executionId as ExecutionId[];
	}
	await performNow(task, data);
	return randomUUID() as ExecutionId;
}
