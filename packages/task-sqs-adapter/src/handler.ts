import {
	BatchWriteItemCommand,
	DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { ChangeMessageVisibilityCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { insertId } from "./idempotency.js";

declare class Task<P> {
	id: string;
	work: (task: { taskId: string; data: P }) => Promise<void>;
	options?: {
		onError?: (error: unknown) => void;
	};
}

const sqsClient = new SQSClient();
const dynamoDbClient = new DynamoDBClient({});

export function makeSQSTaskHandler(task: Task<unknown>) {
	const handler = async (event: SQSEvent) => {
		const failedRecords: SQSRecord[] = [];
		for (const record of event.Records) {
			try {
				await putIdempotencyRecord(record);
				await runTask(task, record);
			} catch (error) {
				console.error("Could not process record", error, record);
				failedRecords.push(record);
			}
		}
		try {
			await putFailures(failedRecords);
			return { batchItemFailures: [] };
		} catch {
			await changeMessageVisibility(failedRecords);
			return {
				batchItemFailures: failedRecords.map((record) => ({
					itemIdentifier: record.messageId,
				})),
			};
		}
	};
	return handler;
}

async function changeMessageVisibility(failedRecords: SQSRecord[]) {
	for (const record of failedRecords) {
		try {
			await sqsClient.send(
				new ChangeMessageVisibilityCommand({
					QueueUrl: process.env.QUEUE_URL,
					ReceiptHandle: record.receiptHandle,
					VisibilityTimeout: 0,
				}),
			);
		} catch (e) {
			console.debug("Could not change message visibility", e);
		}
	}
}

async function runTask(task: Task<unknown>, record: SQSRecord) {
	try {
		await task.work({
			taskId: record.messageId,
			data: JSON.parse(record.body),
		});
	} catch (e) {
		console.error(`Error in task: ${task.id}`, e, record);
		const options = task.options;
		if (options?.onError) {
			try {
				options.onError(new Error("Task error", { cause: e }));
			} catch {
				//
			}
		}
		throw e;
	}
}

async function putIdempotencyRecord(record: SQSRecord) {
	const messageAttributes = record.messageAttributes;

	const taskId = messageAttributes["taskId"]?.stringValue;

	if (taskId === undefined) {
		throw new Error("Expected message attribute with taskId");
	}

	const idempotencyId = messageAttributes["executionId"]?.stringValue;
	if (idempotencyId === undefined) {
		throw new Error("Expected message attribute with executionId");
	}

	await insertId(idempotencyId, 600, { client: dynamoDbClient });
}

async function putFailures(records: SQSRecord[]) {
	if (records.length === 0) return;
	await dynamoDbClient.send(
		new BatchWriteItemCommand({
			RequestItems: {
				[process.env.DYNAMODB_TABLE_NAME!]: records.map((record) => ({
					PutRequest: {
						Item: {
							PK: { S: `FAILED-${process.env.TASK_ID!}` },
							SK: { S: new Date().toISOString() },
							data: { S: record.body },
						},
					},
				})),
			},
		}),
	);
}
