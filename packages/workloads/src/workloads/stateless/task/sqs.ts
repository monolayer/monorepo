import { remember } from "@epic-web/remember";
import {
	type PerformOptions,
	type Task,
} from "~workloads/workloads/stateless/task/task.js";
import { validateJsonStringified } from "~workloads/workloads/stateless/task/validate-data-size.js";
import { TaskSingleSQSClient } from "~workloads/workloads/stateless/task/workers/sqs-single-queue.js";
import { TaskSQSClient } from "~workloads/workloads/stateless/task/workers/sqs.js";

export async function sqsDispatch<P>(
	task: Task<P>,
	data: P | P[],
	options?: PerformOptions,
) {
	if (!Array.isArray(data)) {
		validateJsonStringified(data);

		const executionId = await sqsClient.sendTask(task, options, data);
		return executionId;
	} else {
		data.forEach((d) => validateJsonStringified(d));
		return await sqsClient.sendTaskBatch(task, options, data);
	}
}

const sqsClient = remember("TaskSQSClient", () => new TaskSQSClient({}));

export async function sqsSingleDispatch<P>(
	task: Task<P>,
	data: P | P[],
	options?: PerformOptions,
) {
	if (!Array.isArray(data)) {
		validateJsonStringified(data);
		const executionId = await sqsSingleClient.sendTask(task, options, {
			taskId: task.id,
			payload: data,
		});
		return executionId;
	} else {
		data.forEach((d) => validateJsonStringified(d));
		return await sqsClient.sendTaskBatch(task, options, data);
	}
}

const sqsSingleClient = remember(
	"TaskSQSClient",
	() => new TaskSingleSQSClient({}),
);
