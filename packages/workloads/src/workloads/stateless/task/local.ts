import { remember } from "@epic-web/remember";
import { randomUUID } from "crypto";
import {
	performNow,
	type ExecutionId,
} from "~workloads/workloads/stateless/task/perform-now.js";
import type {
	PerformOptions,
	Task,
} from "~workloads/workloads/stateless/task/task.js";

export async function developmentDispatch<P>(
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

export async function testDispatch<P>(
	task: Task<P>,
	data: P | P[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	options?: PerformOptions,
) {
	const testDispather = dispatcherForTask(task);
	if (Array.isArray(data)) {
		const executionIds: string[] = [];
		const executionId = randomUUID() as ExecutionId;
		for (const single of data) {
			testDispather.push({
				executionId,
				data: single,
			});
			executionIds.push(executionId);
		}
		return executionIds as ExecutionId[];
	}
	const executionId = randomUUID() as ExecutionId;
	testDispather.push({
		executionId: executionId,
		data: data,
	});
	return executionId;
}

export const testDispatchers = remember(
	"TestDispatchers",
	() =>
		({}) as Record<
			string,
			Array<{
				executionId: ExecutionId;
				data: unknown;
			}>
		>,
);

export function dispatcherForTask<P>(task: Task<P>) {
	const queueKey = task.id as keyof typeof testDispatchers;
	if (testDispatchers[queueKey] === undefined) {
		testDispatchers[queueKey] = [];
	}
	return testDispatchers[queueKey] as DispatcherTask<P>[];
}

interface DispatcherTask<P> {
	executionId: ExecutionId;
	data: P;
}
