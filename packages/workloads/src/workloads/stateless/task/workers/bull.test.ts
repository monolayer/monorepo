import { Redis as IORedis } from "ioredis";
import { setTimeout } from "timers/promises";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
	setupBullContext,
	teardownBullContext,
	type BullContext,
} from "~test/__setup__/helpers.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";
import { TaskBullWorker } from "~workloads/workloads/stateless/task/workers/bull.js";

afterEach<BullContext<{ hello: string }>>(async (context) => {
	await teardownBullContext(context);
});

interface TaskData {
	name: string;
}

vi.setConfig({
	maxConcurrency: 1,
});

describe("TaskBullWorker", () => {
	test<BullContext<TaskData>>("Process tasks", async (context) => {
		let processed = 0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const errors: any = [];
		const testTask = new Task<TaskData>(
			"Send Emails",
			async () => {
				processed += 1;
			},
			{
				retry: {
					times: 6,
				},
				onError(error) {
					errors.push(error);
				},
			},
		);

		await setupBullContext(context, testTask);

		const worker = new TaskBullWorker(testTask);
		await worker.waitUntilReady();

		expect(await context.client.zcard(worker.toKey("failed"))).toBe(0);

		await testTask.performLater({ name: "world" });
		await testTask.performLater({ name: "world" });
		await testTask.performLater({ name: "world" });

		while (processed < 3) {
			await setTimeout(5000);
		}
		await worker.close();

		expect(await context.client.zcard(worker.toKey("failed"))).toBe(0);

		expect(errors).toStrictEqual([]);
	});

	test<
		BullContext<TaskData>
	>("Failed tasks go to failed queue and calls onError", async (context) => {
		let processed = 0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const errors: any = [];
		const testTask = new Task<TaskData>(
			"Send Emails",
			async () => {
				processed += 1;
				throw new Error("Something went wrong");
			},
			{
				onError(error) {
					errors.push(error);
				},
			},
		);

		await setupBullContext(context, testTask);

		const worker = new TaskBullWorker(testTask);
		await worker.waitUntilReady();

		expect(await context.client.zcard(worker.toKey("failed"))).toBe(0);

		await testTask.performLater({ name: "world" });
		await testTask.performLater({ name: "world" });
		await testTask.performLater({ name: "world" });

		while (processed < 3) {
			await setTimeout(50);
		}
		await worker.close();

		expect(await context.client.zcard(worker.toKey("failed"))).toBe(3);
	});

	test<
		BullContext<TaskData>
	>("onError callback is called when a task throws", async (context) => {
		let processed = 0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const errors: any = [];
		const testTask = new Task<TaskData>(
			"Send Emails",
			async () => {
				processed += 1;
				throw new Error("Something went wrong");
			},
			{
				onError(error) {
					errors.push({
						task: error.cause.task,
						executionId: error.cause.executionId,
						data: error.cause.data,
					});
				},
				retry: {
					times: 1,
					backoff: {
						type: "constant",
						delay: 1,
					},
				},
			},
		);

		await setupBullContext(context, testTask);

		const worker = new TaskBullWorker(testTask);
		await worker.waitUntilReady();

		const jobIds = [
			await testTask.performLater({ name: "world" }),
			await testTask.performLater({ name: "world" }),
			await testTask.performLater({ name: "world" }),
		];

		while (processed < 3) {
			await setTimeout(50);
		}
		await worker.close();

		expect(errors).toStrictEqual(
			jobIds.map((jobId) => ({
				task: "send-emails",
				executionId: jobId,
				data: { name: "world" },
			})),
		);
	});

	test<
		BullContext<TaskData>
	>("onError callback is called on connection errors", async () => {
		vi.stubEnv("MONO_TASK_REDIS_URL", "redis://nonexistenthost:6379");
		const errors: Error[] = [];
		const testTask = new Task<TaskData>("Send Emails", async () => {}, {
			onError(error) {
				errors.push(error);
			},
		});

		const worker = new TaskBullWorker(testTask);

		await setTimeout(1000);
		await worker.close();

		expect(errors.length).toBeGreaterThan(0);
		console.log(errors);
		expect(
			errors.every((error) => error.message === "Error while performing tasks"),
		).toBe(true);
	});
});

export async function jobKeysInRedis(client: IORedis) {
	const allKeys = await client.scan(0, "MATCH", "*");

	const taskKeys = (allKeys[1] ?? []).filter((key) =>
		key.match(/:\w+-\w+-\w+-\w+-\w+/),
	);
	return taskKeys;
}
