import { GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { setTimeout } from "timers/promises";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	setupSqsQueueForWorker,
	tearDownSqsQueueForWorker,
	type TaskSQSWorkerContext,
} from "~test/__setup__/helpers.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

import {
	TaskSQSClient,
	TaskSQSWorker,
} from "~workloads/workloads/stateless/task/workers/sqs.js";

vi.setConfig({
	maxConcurrency: 1,
});

describe("TaskSQSWorker", { sequential: true, concurrent: false }, () => {
	beforeEach<TaskSQSWorkerContext>(async (context) => {
		await setupSqsQueueForWorker(context);
	});

	afterEach<TaskSQSWorkerContext>(async (context) => {
		vi.unstubAllEnvs();
		await tearDownSqsQueueForWorker(context);
	});

	test<TaskSQSWorkerContext>("processes tasks one at a time", async (context) => {
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
		const sqsWorker = new TaskSQSWorker(testTask);

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

	test<TaskSQSWorkerContext>("removes successful tasks from queue", async (context) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const processedTask: any[] = [];
		const testTask = new Task<Record<string, string>>(
			context.task.id,
			async () => {
				processedTask.push(1);
			},
			{
				onError() {},
			},
		);
		const client = new TaskSQSClient();
		await client.sendTask(testTask, {}, { hello: "world" });
		await client.sendTask(testTask, {}, { hello: "world" });
		const sqsWorker = new TaskSQSWorker(testTask);

		while (processedTask.length !== 2) {
			await setTimeout(50);
		}
		sqsWorker.stop();

		const command = new GetQueueAttributesCommand({
			QueueUrl: context.queueUrl,
			AttributeNames: ["ApproximateNumberOfMessages"],
		});
		const response = await client.send(command);
		expect(response.Attributes?.ApproximateNumberOfMessages).toEqual("0");
	});

	test<TaskSQSWorkerContext>(
		"retries tasks and handles errors",
		{ timeout: 100000 },
		async (context) => {
			let runs = 0;
			let errors = 0;
			const testTask = new Task<Record<string, string>>(
				context.task.id,
				async () => {
					runs += 1;
					throw new Error("task error");
				},
				{
					onError(error) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						if ((error.cause.error as any).name !== "AbortError") {
							errors += 1;
						}
					},
				},
			);
			const client = new TaskSQSClient();
			await client.sendTask(testTask, {}, { hello: "world" });

			const sqsWorker = new TaskSQSWorker(testTask);

			await setTimeout(90000);
			sqsWorker.stop();

			const command = new GetQueueAttributesCommand({
				QueueUrl: context.deadLetterQueueUrl,
				AttributeNames: ["ApproximateNumberOfMessages"],
			});
			const response = await client.send(command);
			expect(response.Attributes?.ApproximateNumberOfMessages).toEqual("1");
			expect(runs).toEqual(2);
			expect(errors).toEqual(2);
		},
	);
});
