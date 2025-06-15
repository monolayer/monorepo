// counter.test.ts
import {
	DynamoDBClient,
	GetItemCommand,
	PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { describe, expect, test } from "vitest";
import { incrementFailed, incrementFinished } from "./queue-stats.js";

const client = new DynamoDBClient({});

async function getCounterValue(id: string) {
	const res = await client.send(
		new GetItemCommand({
			TableName: process.env.DYNAMODB_TABLE_NAME!,
			Key: {
				PK: { S: `STATS-${id}` },
				SK: { S: `STATS-${id}` },
			},
		}),
	);
	return {
		finished: res.Item?.finished?.N ? Number(res.Item.finished.N) : undefined,
		failed: res.Item?.failed?.N ? Number(res.Item.failed.N) : undefined,
	};
}

describe("increment finished", () => {
	test("initializes counter to 1 if it does not exist", async () => {
		const result = await incrementFinished("task-1");
		expect(result).toBe(1);

		const dbValue = await getCounterValue("task-1");
		expect(dbValue.finished).toBe(1);
	});

	test("increments existing counter by 1", async () => {
		// Pre-set the counter to 5
		await client.send(
			new PutItemCommand({
				TableName: process.env.DYNAMODB_TABLE_NAME!,
				Item: {
					PK: { S: "STATS-task-2" },
					SK: { S: "STATS-task-2" },
					finished: { N: "5" },
				},
			}),
		);

		const result = await incrementFinished("task-2");
		expect(result).toBe(6);

		const dbValue = await getCounterValue("task-2");
		expect(dbValue.finished).toBe(6);
	});

	test("increments multiple times correctly", async () => {
		const r1 = await incrementFinished("task-3");
		expect(r1).toBe(1);

		const r2 = await incrementFinished("task-3");
		expect(r2).toBe(2);

		const r3 = await incrementFinished("task-3");
		expect(r3).toBe(3);

		const dbValue = await getCounterValue("task-3");
		expect(dbValue.finished).toBe(3);
	});
});

describe("increment failed", () => {
	test("initializes counter to 1 if it does not exist", async () => {
		const result = await incrementFailed("task-1");
		expect(result).toBe(1);

		const dbValue = await getCounterValue("task-1");
		expect(dbValue.failed).toBe(1);
	});

	test("increments existing counter by 1", async () => {
		// Pre-set the counter to 5
		await client.send(
			new PutItemCommand({
				TableName: process.env.DYNAMODB_TABLE_NAME!,
				Item: {
					PK: { S: "STATS-task-2" },
					SK: { S: "STATS-task-2" },
					failed: { N: "5" },
				},
			}),
		);

		const result = await incrementFailed("task-2");
		expect(result).toBe(6);

		const dbValue = await getCounterValue("task-2");
		expect(dbValue.failed).toBe(6);
	});

	test("increments multiple times correctly", async () => {
		const r1 = await incrementFailed("task-3");
		expect(r1).toBe(1);

		const r2 = await incrementFailed("task-3");
		expect(r2).toBe(2);

		const r3 = await incrementFailed("task-3");
		expect(r3).toBe(3);

		const dbValue = await getCounterValue("task-3");
		expect(dbValue.failed).toBe(3);
	});
});
