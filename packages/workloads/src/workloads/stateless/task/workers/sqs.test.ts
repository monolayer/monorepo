import {
	GetQueueAttributesCommand,
	ReceiveMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import { setTimeout } from "timers/promises";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	setupSqsQueueForWorker,
	tearDownSqsQueueForWorker,
	type TaskSQSWorkerContext,
} from "~test/__setup__/helpers.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

import {
	ChangeMessageVisibilityCommand,
	DeleteMessageCommand,
	type DeleteMessageCommandInput,
	type Message,
	type ReceiveMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { mockClient } from "aws-sdk-client-mock";
import {
	TaskSQSClient,
	TaskSQSWorker,
	VisibilityHeartbeat,
} from "~workloads/workloads/stateless/task/workers/sqs.js";

vi.setConfig({
	allowOnly: true,
	testTimeout: 20_000,
	hookTimeout: 20_000,
	maxConcurrency: 1,
});

describe("TaskSQSClient", { sequential: true, concurrent: false }, () => {
	describe("receiveMessage", () => {
		interface ReceiveMsgContext {
			sqsMock: ReturnType<typeof mockClient>;
			testTask: Task<unknown>;
			input: () => ReceiveMessageCommandInput;
		}

		beforeEach<ReceiveMsgContext>(async (context) => {
			const taskSQSClient = new TaskSQSClient({});
			context.sqsMock = mockClient(taskSQSClient)
				.on(ReceiveMessageCommand)
				.resolves({ Messages: [{}] as Message[] });

			context.testTask = new Task("Send emails", async () => {}, {});

			await taskSQSClient.receiveTask("fakequeue", {
				visibilityTimeout: 20,
				waitTime: 10,
				abortController: new AbortController(),
			});

			context.input = () =>
				context.sqsMock.calls()[0]!.firstArg
					.input as ReceiveMessageCommandInput;
		});

		test<ReceiveMsgContext>("calls once to SQS", async ({ sqsMock }) => {
			const calls = sqsMock.calls();
			expect(calls.length).toBe(1);
		});

		test<ReceiveMsgContext>("sets QueueUrl", async ({ input }) => {
			expect(input().QueueUrl).toBe("fakequeue");
		});

		test<ReceiveMsgContext>("sets MaxNumberOfMessages", async ({ input }) => {
			expect(input().MaxNumberOfMessages).toBe(1);
		});

		test<ReceiveMsgContext>("sets VisibilityTimeout", async ({ input }) => {
			expect(input().VisibilityTimeout).toBe(20);
		});

		test<ReceiveMsgContext>("sets WaitTimeSeconds", async ({ input }) => {
			expect(input().WaitTimeSeconds).toBe(10);
		});

		test("returns undefined when no message are received", async () => {
			const taskSQSClient = new TaskSQSClient({});
			const sqsMock = mockClient(taskSQSClient);
			sqsMock.on(ReceiveMessageCommand).resolves({});

			const result = await taskSQSClient.receiveTask("fakequeue", {
				visibilityTimeout: 20000,
				waitTime: 10,
				abortController: new AbortController(),
			});

			expect(result).toBeUndefined();
			const calls = sqsMock.calls();
			expect(calls.length).toBe(1);
		});

		test("throws on empty messages list", async () => {
			const taskSQSClient = new TaskSQSClient({});
			const sqsMock = mockClient(taskSQSClient);

			sqsMock.on(ReceiveMessageCommand).resolves({ Messages: [] as Message[] });

			expect(
				async () =>
					await taskSQSClient.receiveTask("fakequeue", {
						visibilityTimeout: 20000,
						waitTime: 10,
						abortController: new AbortController(),
					}),
			).rejects.toThrow("no message received from ReceiveMessageCommand (SQS)");

			const calls = sqsMock.calls();
			expect(calls.length).toBe(1);
		});
	});
	test("deleteMessageFromQueue", async () => {
		const taskSQSClient = new TaskSQSClient({});
		const sqsMock = mockClient(taskSQSClient);

		sqsMock.on(DeleteMessageCommand);

		await taskSQSClient.deleteTask("fakequeue", "fakehandle");

		const input = sqsMock.calls()[0]!.firstArg
			.input as DeleteMessageCommandInput;

		expect(input.QueueUrl).toBe("fakequeue");
		expect(input.ReceiptHandle).toBe("fakehandle");
	});
});

describe("VisibilityHeartbeat", { sequential: true, concurrent: false }, () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	test("Extends the visibility of a message by 1000ms every 500ms until stop", async () => {
		const sqsMock = mockClient(new SQSClient({}));
		const heartbeat = new VisibilityHeartbeat(sqsMock as unknown as SQSClient, {
			queueUrl: "somequeue",
			messageReceiptHandle: "fakeHandle",
			extendBy: 1000,
			abortController: new AbortController(),
		});

		await vi.advanceTimersByTimeAsync(1999);

		heartbeat.stop();

		const calls = sqsMock.calls();
		const callsAfterStop = calls.length;

		expect(callsAfterStop).toBe(3);

		for (const call of calls) {
			expect(call.firstArg).toBeInstanceOf(ChangeMessageVisibilityCommand);
			const arg = call.firstArg as ChangeMessageVisibilityCommand;
			expect(arg.input.QueueUrl).toBe("somequeue");
			expect(arg.input.ReceiptHandle).toBe("fakeHandle");
			expect(arg.input.VisibilityTimeout).toBe(1000);
		}
	});
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
