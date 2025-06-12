import {
	SendMessageBatchCommand,
	SendMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import { randomUUID } from "node:crypto";
import { snakeCase } from "./snake-case.js";
import type { ExecutionId, PerformOptions, Task } from "./types.js";

const sqsClient = new SQSClient({});

export async function dispatcher<P>(
	task: Task<P>,
	data: P | P[],
	options?: PerformOptions,
) {
	if (!Array.isArray(data)) {
		validateJsonStringified(data);
		return await sendTask(task, options, data);
	} else {
		data.forEach((d) => validateJsonStringified(d));
		return await sendTaskBatch(task, options, data);
	}
}

async function sendTask<P>(
	task: Task<P>,
	options: PerformOptions | undefined,
	data: P,
) {
	const queueUrl = sqsTaskQueueURL(task.id)!;
	const executionId = randomUUID();
	await sqsClient.send(
		new SendMessageCommand(
			messageEntry(task, queueUrl, options, executionId, data),
		),
	);
	return executionId as ExecutionId;
}

async function sendTaskBatch<P>(
	task: Task<P>,
	options: PerformOptions | undefined,
	data: P[],
) {
	const queueUrl = sqsTaskQueueURL(task.id)!;
	const entries = data.map((p) => {
		const executionId = randomUUID();
		return {
			...messageEntry(task, queueUrl, options, executionId, p),
			Id: executionId,
		};
	});
	await sqsClient.send(
		new SendMessageBatchCommand({
			QueueUrl: queueUrl,
			Entries: entries,
		}),
	);
	return entries.map((entry) => entry.Id as ExecutionId);
}

export function sqsTaskQueueURL(taskId: string) {
	return process.env[
		`ML_TASK_${snakeCase(taskId).toUpperCase()}_SQS_QUEUE_URL`
	];
}

function messageEntry<P>(
	task: Task<P>,
	queueUrl: string,
	options: PerformOptions | undefined,
	executionId: string,
	data: P,
) {
	const messageAttributes = {
		taskId: {
			DataType: "String",
			StringValue: task.id,
		},
		executionId: {
			DataType: "String",
			StringValue: executionId,
		},
		attempts: {
			DataType: "String",
			StringValue: String(task.options?.retry?.times ?? 1),
		},
	};
	return {
		QueueUrl: queueUrl,
		DelaySeconds: options?.delay ? options.delay / 1000 : undefined,
		MessageAttributes: messageAttributes,
		MessageBody: JSON.stringify(data),
	};
}

function validateJsonStringified<P>(data: P, max: number = 256000) {
	const dataString = JSON.stringify(typeof data === "undefined" ? {} : data);
	const byteLength = Buffer.byteLength(dataString, "utf8");

	if (byteLength > max) {
		throw new Error(`Data size exceeds the limit (${max} bytes)`);
	}
}
