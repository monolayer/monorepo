import type {
	PerformOptions,
	Task,
} from "~workloads/workloads/stateless/task/task.js";

import { dispatcher } from "~workloads/workloads/stateless/task/dispatcher.js";

export async function performLater<P>(
	task: Task<P>,
	data: P | P[],
	options?: PerformOptions,
) {
	return await dispatcher()(task, data, options);
}
