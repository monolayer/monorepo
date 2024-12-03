import { remember } from "@epic-web/remember";
import {
	type PerformOptions,
	type Task,
} from "~workloads/workloads/stateless/task/task.js";
import { validateJsonStringified } from "~workloads/workloads/stateless/task/validate-data-size.js";
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
