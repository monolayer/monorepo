import { remember } from "@epic-web/remember";
import { SQSClient } from "src/client.js";
import type { PerformOptions, Task } from "src/types.js";

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

const sqsClient = remember("TaskSQSClient", () => new SQSClient({}));

function validateJsonStringified<P>(data: P, max: number = 256000) {
	const dataString = JSON.stringify(typeof data === "undefined" ? {} : data);
	const byteLength = Buffer.byteLength(dataString, "utf8");

	if (byteLength > max) {
		throw new Error(`Data size exceeds the limit (${max} bytes)`);
	}
}
