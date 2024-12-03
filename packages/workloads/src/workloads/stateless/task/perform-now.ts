import type { Task } from "~workloads/workloads/stateless/task/task.js";

import { randomUUID } from "node:crypto";
import workAndHandleError from "~workloads/workloads/stateless/task/perform.js";

export async function performNow<P>(task: Task<P>, data: P | P[]) {
	if (!Array.isArray(data)) {
		const taskId = randomUUID();
		await workAndHandleError({ task, taskId, data });
		return taskId as ExecutionId;
	} else {
		const taskIds: ExecutionId[] = [];
		for (const singlePayload of data) {
			const taskId = randomUUID() as ExecutionId;
			await workAndHandleError({ task, taskId, data: singlePayload });
			taskIds.push(taskId);
		}
		return taskIds;
	}
}

export type ExecutionId = string & {
	_brand: "ExecutionId";
};
