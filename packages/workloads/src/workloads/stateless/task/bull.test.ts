import { Redis as IORedis } from "ioredis";
import { setTimeout } from "timers/promises";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	setupBullContext,
	teardownBullContext,
	type BullContext,
} from "~test/__setup__/helpers.js";
import { TaskBullWorker } from "~workloads/workloads/stateless/task/bull.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

beforeEach<BullContext<{ hello: string }>>(async (context) => {
	await setupBullContext(context);
});

afterEach<BullContext<{ hello: string }>>(async (context) => {
	await teardownBullContext(context);
});

test<BullContext<{ hello: string }>>(
	"sends task to queue",
	{ sequential: true, concurrent: false },
	async (context) => {
		await context.testTask.performLater({ hello: "world" });

		const jobKeys = await jobKeysInRedis(context.client);

		expect(jobKeys.length).toBe(1);

		for (const key of jobKeys) {
			await assertBullJob(context.client, key, { hello: "world" });
		}
	},
);

test<BullContext<{ hello: string }>>(
	"sends task to queue with delay",
	{ sequential: true, concurrent: false },
	async (context) => {
		await context.testTask.performLater({ hello: "world" }, { delay: 2000 });

		const jobKeys = await jobKeysInRedis(context.client);

		expect(jobKeys.length).toBe(1);

		for (const key of jobKeys) {
			await assertBullJob(context.client, key, { hello: "world" }, 2000);
		}
	},
);

test<BullContext<{ hello: string }>>(
	"sends tasks in bulk to queue",
	{ sequential: true, concurrent: false },
	async (context) => {
		await context.testTask.performLater([
			{ hello: "world" },
			{ hello: "world" },
			{ hello: "world" },
		]);

		const jobKeys = await jobKeysInRedis(context.client);

		expect(jobKeys.length).toBe(3);

		for (const key of jobKeys) {
			await assertBullJob(context.client, key, { hello: "world" });
		}
	},
);

interface TaskData {
	name: string;
}

describe("TaskBullWorker", () => {
	test<BullContext<TaskData>>(
		"Process tasks",
		{ sequential: true, concurrent: false, timeout: 300000 },
		async (context) => {
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
		},
	);

	test<BullContext<TaskData>>(
		"Failed tasks go to failed queue and calls onError",
		{ sequential: true, concurrent: false },
		async (context) => {
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
		},
	);

	test<BullContext<TaskData>>(
		"onError callback is called when a task throws",
		{ sequential: true, concurrent: false },
		async (context) => {
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
		},
	);

	test<BullContext<TaskData>>(
		"onError callback is called on connection errors",
		{ sequential: true, concurrent: false },
		async () => {
			vi.stubEnv("MONO_TASK_REDIS_URL", "redis://nonexistenthost:6379");
			const errors: Error[] = [];
			const testTask = new Task<TaskData>("Send Emails", async () => {}, {
				onError(error) {
					errors.push(error);
				},
			});

			const worker = new TaskBullWorker(testTask);

			await setTimeout(100);
			await worker.close();

			expect(errors.length).toBeGreaterThan(0);
			console.log(errors);
			expect(
				errors.every(
					(error) => error.message === "Error while performing tasks",
				),
			).toBe(true);
		},
	);
});

export async function jobKeysInRedis(client: IORedis) {
	const allKeys = await client.scan(0, "MATCH", "*");

	const taskKeys = (allKeys[1] ?? []).filter((key) =>
		key.match(/:\w+-\w+-\w+-\w+-\w+/),
	);
	return taskKeys;
}

async function assertBullJob(
	client: IORedis,
	key: string,
	data: Record<string, string>,
	delay: number = 0,
) {
	const result = await client.hgetall(key);
	expect(result.name).toStrictEqual("send-emails");
	expect(result.priority).toStrictEqual("0");
	expect(JSON.parse(result.data ?? "")).toStrictEqual(data);
	expect(result.delay).toStrictEqual(String(delay));
	const opts = JSON.parse(result.opts ?? "");
	const jobId = key.match(/:(\w+-\w+-\w+-\w+-\w+)/)![1];
	expect(opts.jobId).toStrictEqual(jobId);
	expect(opts.backoff).toStrictEqual({ type: "custom" });
}
