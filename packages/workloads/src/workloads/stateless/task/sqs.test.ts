import {
	CreateQueueCommand,
	ReceiveMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import { snakeCase } from "case-anything";
import type { StartedTestContainer } from "testcontainers";
import { setTimeout } from "timers/promises";
import {
	afterEach,
	assert,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import {
	localstackConnectionstring,
	localStackSQSQueueUrl,
	startLocalStackContainer,
} from "~test/__setup__/helpers.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

import { TaskSQSClient } from "~workloads/workloads/stateless/task/workers/sqs.js";

interface SQSContext<P> {
	container: StartedTestContainer;
	client: SQSClient;
	testTask: Task<P>;
	queueUrl: string;
}

vi.setConfig({
	allowOnly: true,
	testTimeout: 20_000,
	hookTimeout: 20_000,
	maxConcurrency: 1,
});

describe("performLater", { sequential: true, concurrent: false }, () => {
	beforeEach<SQSContext<{ hello: string }>>(async (context) => {
		context.container = await startLocalStackContainer();
		const url = localstackConnectionstring(context.container);
		vi.stubEnv("AWS_ENDPOINT_URL_SQS", url);
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "sqs");
		context.client = new TaskSQSClient();
		context.testTask = new Task("Send emails", async () => {}, {});
		const createQueue = new CreateQueueCommand({
			QueueName: context.testTask.id,
		});
		const result = await context.client.send(createQueue);
		context.queueUrl = localStackSQSQueueUrl(result.QueueUrl!, url);
		vi.stubEnv(
			`MONO_TASK_${snakeCase(context.testTask.id).toUpperCase()}_SQS_QUEUE_URL`,
			context.queueUrl,
		);

		context.testTask = new Task("Send emails", async () => {}, {});
	});

	afterEach<SQSContext<{ hello: string }>>(async (context) => {
		if (context.container) {
			await context.container.stop();
		}
	});

	test<SQSContext<{ hello: string }>>("send tasks", async (context) => {
		const firstMessageId = await context.testTask.performLater({
			hello: "world",
		});
		const secondMessageId = await context.testTask.performLater({
			hello: "planet",
		});

		const queueMesages = await context.client.send(
			new ReceiveMessageCommand({
				QueueUrl: context.queueUrl,
				MaxNumberOfMessages: 10,
				MessageAttributeNames: ["executionId", "attempts"],
			}),
		);

		assert(queueMesages.Messages);
		expect(queueMesages.Messages.length).toBe(2);

		expect(
			queueMesages.Messages.map((m) => ({
				body: JSON.parse(m.Body ?? ""),
				executionId: m.MessageAttributes!["executionId"]?.StringValue,
				attempts: m.MessageAttributes!["attempts"]?.StringValue,
			})),
		).toStrictEqual([
			{ body: { hello: "world" }, executionId: firstMessageId, attempts: "1" },
			{
				body: { hello: "planet" },
				executionId: secondMessageId,
				attempts: "1",
			},
		]);
	});

	test<
		SQSContext<{ hello: string }>
	>("send tasks with delay", async (context) => {
		const messageId = await context.testTask.performLater(
			{
				hello: "world",
			},
			{ delay: 2000 },
		);

		assert.isUndefined(
			(
				await context.client.send(
					new ReceiveMessageCommand({
						QueueUrl: context.queueUrl,
						MaxNumberOfMessages: 10,
						MessageAttributeNames: ["executionId", "attempts"],
					}),
				)
			).Messages,
		);

		await setTimeout(4000);

		const queueMesages = await context.client.send(
			new ReceiveMessageCommand({
				QueueUrl: context.queueUrl,
				MaxNumberOfMessages: 10,
				MessageAttributeNames: ["executionId", "attempts"],
			}),
		);

		assert(queueMesages.Messages);
		expect(queueMesages.Messages.length).toBe(1);

		expect(
			queueMesages.Messages.map((m) => ({
				body: JSON.parse(m.Body ?? ""),
				executionId: m.MessageAttributes!["executionId"]?.StringValue,
				attempts: m.MessageAttributes!["attempts"]?.StringValue,
			})),
		).toStrictEqual([
			{ body: { hello: "world" }, executionId: messageId, attempts: "1" },
		]);
	});

	test<SQSContext<{ hello: string }>>("send tasks in bulk", async (context) => {
		const messageIds = await context.testTask.performLater([
			{
				hello: "world",
			},
			{
				hello: "planet",
			},
		]);

		const queueMesages = await context.client.send(
			new ReceiveMessageCommand({
				QueueUrl: context.queueUrl,
				MaxNumberOfMessages: 10,
				MessageAttributeNames: ["executionId", "attempts"],
			}),
		);

		assert(queueMesages.Messages);
		expect(queueMesages.Messages.length).toBe(2);

		expect(
			queueMesages.Messages.map((m) => ({
				body: JSON.parse(m.Body ?? ""),
				executionId: m.MessageAttributes!["executionId"]?.StringValue,
				attempts: m.MessageAttributes!["attempts"]?.StringValue,
			})),
		).toStrictEqual([
			{ body: { hello: "world" }, executionId: messageIds[0], attempts: "1" },
			{ body: { hello: "planet" }, executionId: messageIds[1], attempts: "1" },
		]);
	});
});
