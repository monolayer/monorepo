import {
	dispatcherForTask,
	testDispatchers,
} from "~workloads/workloads/stateless/task/local.js";
import type { ExecutionId } from "~workloads/workloads/stateless/task/perform-now.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";

export interface PerformedTask<P> {
	executionId: ExecutionId;
	data: P;
}

/**
 * Returns all the performed tasks for a `Task` workload.
 */
export function performedTasks<P>(task: Task<P>) {
	return dispatcherForTask(task) as PerformedTask<P>[];
}

/**
 * Deletes all the performed tasks for a `Task` workload.
 */
export function clearPerformedTasks<P>(task: Task<P>) {
	const dispatchers = testDispatchers;
	delete dispatchers[task.id];
}
