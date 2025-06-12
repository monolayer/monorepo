import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ChangeMessageVisibilityCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { SQSBatchItemFailure, SQSEvent } from "aws-lambda";
import path from "node:path";
import { insertId } from "./idempotency.js";

declare class Task<P> {
	id: string;
	work: (task: { taskId: string; data: P }) => Promise<void>;
	options?: {
		onError?: (error: unknown) => void;
	};
}

type TaskId = string & {};
const tasks: Record<TaskId, Task<unknown>> = {};

const dynamoDbClient = new DynamoDBClient({});

const sqsClient = new SQSClient();

export function makeSQSTaskHandler(opts: { tasksDir: string }) {
	const handler = async (event: SQSEvent) => {
		const batchItemFailures: {
			failure: SQSBatchItemFailure;
			receiptHandle: string;
		}[] = [];
		for (const record of event.Records) {
			try {
				const messageAttributes = record.messageAttributes;
				if (messageAttributes === undefined) {
					throw new Error("Expected record with message attributes");
				}

				const taskId = messageAttributes["taskId"]?.stringValue;
				if (taskId === undefined) {
					throw new Error("Expected message attribute with taskId");
				}

				const idempotencyId = messageAttributes["executionId"]?.stringValue;
				if (idempotencyId === undefined) {
					throw new Error("Expected message attribute with executionId");
				}

				if (tasks[taskId] === undefined) {
					tasks[taskId] = (
						await import(path.join(opts.tasksDir, taskId, "index.mjs"))
					).default;
				}

				await insertId(idempotencyId, 600, { client: dynamoDbClient });

				const task = tasks[taskId];
				if (task === undefined) {
					throw new Error("Expected defined task");
				}
				try {
					await task.work({
						taskId: record.messageId,
						data: JSON.parse(record.body),
					});
				} catch (e) {
					console.error(`Error in task: ${task.id}`, e, record);
					batchItemFailures.push({
						failure: { itemIdentifier: record.messageId },
						receiptHandle: record.receiptHandle,
					});
					const options = task.options;
					if (options?.onError) {
						try {
							options.onError(new Error("Task error", { cause: e }));
						} catch {
							//
						}
					}
				}
			} catch (error) {
				batchItemFailures.push({
					failure: { itemIdentifier: record.messageId },
					receiptHandle: record.receiptHandle,
				});
				console.error("Could not process record", error, record);
			}
		}
		try {
			for (const failure of batchItemFailures) {
				await sqsClient.send(
					new ChangeMessageVisibilityCommand({
						QueueUrl: process.env.QUEUE_URL,
						ReceiptHandle: failure.receiptHandle,
						VisibilityTimeout: 0,
					}),
				);
			}
		} catch (e) {
			console.log("ChangeMessageVisibility failed", e);
		}
		return { batchItemFailures: batchItemFailures.map((b) => b.failure) };
	};
	return handler;
}
