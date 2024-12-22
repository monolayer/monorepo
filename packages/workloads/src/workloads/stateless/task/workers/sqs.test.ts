import { ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
	VisibilityHeartbeat,
} from "~workloads/workloads/stateless/task/workers/sqs.js";

vi.setConfig({
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
