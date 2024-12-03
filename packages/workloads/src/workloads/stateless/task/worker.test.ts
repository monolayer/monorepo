import { setTimeout } from "timers/promises";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	setupBullContext,
	setupSqsQueueForWorker,
	teardownBullContext,
	tearDownSqsQueueForWorker,
	type BullContext,
	type TaskSQSWorkerContext,
} from "~test/__setup__/helpers.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";
import { TaskWorker } from "~workloads/workloads/stateless/task/worker.js";
import type { TaskBullWorker } from "~workloads/workloads/stateless/task/workers/bull.js";
import { TaskSQSClient } from "~workloads/workloads/stateless/task/workers/sqs.js";

interface TaskData {
	name: string;
}

vi.setConfig({
	maxConcurrency: 1,
});

describe("Bull", () => {
	afterEach<BullContext<{ hello: string }>>(async (context) => {
		await teardownBullContext(context);
	});

	test<BullContext<TaskData>>("Work with bull", async (context) => {
		vi.stubEnv("MONO_TASK_MODE", "bull");

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

		const worker = new TaskWorker(testTask);

		const bullWorker = worker.worker as unknown as TaskBullWorker<
			typeof testTask
		>;
		expect(await context.client.zcard(bullWorker.toKey("failed"))).toBe(0);

		await testTask.performLater({ name: "world" });
		await testTask.performLater({ name: "world" });
		await testTask.performLater({ name: "world" });

		while (processed < 3) {
			await setTimeout(5000);
		}
		await worker.stop();

		expect(await context.client.zcard(bullWorker.toKey("failed"))).toBe(0);

		expect(errors).toStrictEqual([]);
	});
});

describe("SQS", () => {
	beforeEach<TaskSQSWorkerContext>(async (context) => {
		await setupSqsQueueForWorker(context);
	});

	afterEach<TaskSQSWorkerContext>(async (context) => {
		await tearDownSqsQueueForWorker(context);
	});

	test<TaskSQSWorkerContext>("work with sqs", async (context) => {
		vi.stubEnv("MONO_TASK_MODE", "sqs");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const processedTask: any[] = [];
		const testTask = new Task<Record<string, string>>(
			context.task.id,
			async (data): Promise<void> => {
				processedTask.push(data);
			},
			{
				onError() {},
			},
		);
		const client = new TaskSQSClient();
		const executionId = await client.sendTask(testTask, {}, { hello: "world" });
		const secondExecutionId = await client.sendTask(
			testTask,
			{},
			{ hello: "world" },
		);
		const sqsWorker = new TaskWorker(testTask);

		while (processedTask.length === 0) {
			await setTimeout(1000);
		}
		sqsWorker.stop();
		expect(processedTask).toStrictEqual([
			{
				data: {
					hello: "world",
				},
				taskId: executionId,
			},
			{
				data: {
					hello: "world",
				},
				taskId: secondExecutionId,
			},
		]);
	});
});
