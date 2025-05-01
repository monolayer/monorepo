import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { SQSBatchItemFailure, SQSEvent } from "aws-lambda";
import path from "node:path";
import { insertId } from "./idempotency.js";

declare class Task<P> {
	id: string;
	work: (task: { taskId: string; data: P }) => Promise<void>;
	options: {
		onError?: (error: unknown) => void;
	};
}

type TaskId = string & {};
const tasks: Record<TaskId, Task<unknown>> = {};

const dynamoDbClient = new DynamoDBClient({});

export function makeSQSTaskHandler(opts: { tasksDir: string }) {
	const handler = async (event: SQSEvent) => {
		const batchItemFailures: SQSBatchItemFailure[] = [];
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
					batchItemFailures.push({ itemIdentifier: record.messageId });
					const options = task.options;
					if (options === undefined) return;
					if (options.onError) {
						try {
							options.onError(new Error("Task error", { cause: e }));
						} catch {
							//
						}
					}
				}
			} catch (error) {
				batchItemFailures.push({ itemIdentifier: record.messageId });
				console.error("Could not process record", error, record);
			}
			return { batchItemFailures };
		}
	};
	return handler;
}
