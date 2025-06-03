import { ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { kebabCase, snakeCase } from "case-anything";
import type { Task } from "src/types.js";
import {
	setupSqsQueueForWorker,
	tearDownSqsQueueForWorker,
	type TaskSQSWorkerContext,
} from "tests/setup.js";
import { setTimeout } from "timers/promises";
import { afterEach, assert, beforeEach, expect, test, vi } from "vitest";
import { dispatcher, sqsTaskQueueURL } from "./dispatcher.js";

vi.setConfig({
	allowOnly: true,
	testTimeout: 20_000,
	hookTimeout: 20_000,
	maxConcurrency: 1,
});

beforeEach<TaskSQSWorkerContext>(async (context) => {
	await setupSqsQueueForWorker(context);
});

afterEach<TaskSQSWorkerContext>(async (context) => {
	vi.unstubAllEnvs();
	await tearDownSqsQueueForWorker(context);
});

test<TaskSQSWorkerContext>("task queue url", async (context) => {
	expect(sqsTaskQueueURL(context.task.id)).toBe(
		process.env[
			`ML_TASK_${snakeCase(context.task.id).toUpperCase()}_SQS_QUEUE_URL`
		],
	);
});

test<TaskSQSWorkerContext>("send tasks to queue", async (context) => {
	const testTask = { id: kebabCase(context.task.id) } as Task<unknown>;
	const firstMessageId = await dispatcher(testTask, { hello: "world" }, {});
	const secondMessageId = await dispatcher(
		testTask,
		{
			hello: "planet",
		},
		{},
	);

	const queueMesages = await context.awsSqsClient.send(
		new ReceiveMessageCommand({
			QueueUrl: context.queueUrl,
			MaxNumberOfMessages: 10,
			MessageAttributeNames: ["executionId", "attempts", "taskId"],
		}),
	);

	assert(queueMesages.Messages);
	expect(queueMesages.Messages.length).toBe(2);

	expect(
		queueMesages.Messages.map((m) => ({
			body: JSON.parse(m.Body ?? ""),
			executionId: m.MessageAttributes!["executionId"]?.StringValue,
			taskId: m.MessageAttributes!["taskId"]?.StringValue,
			attempts: m.MessageAttributes!["attempts"]?.StringValue,
		})),
	).toStrictEqual([
		{
			body: { hello: "world" },
			executionId: firstMessageId,
			attempts: "1",
			taskId: kebabCase(context.task.id),
		},
		{
			body: { hello: "planet" },
			executionId: secondMessageId,
			attempts: "1",
			taskId: kebabCase(context.task.id),
		},
	]);
});

test<TaskSQSWorkerContext>("send tasks to queue with delay", async (context) => {
	const testTask = { id: kebabCase(context.task.id) } as Task<unknown>;

	const messageId = await dispatcher(
		testTask,
		{
			hello: "world",
		},
		{ delay: 3000 },
	);

	assert.isUndefined(
		(
			await context.awsSqsClient.send(
				new ReceiveMessageCommand({
					QueueUrl: context.queueUrl,
					MaxNumberOfMessages: 10,
					MessageAttributeNames: ["executionId", "attempts", "taskId"],
				}),
			)
		).Messages,
	);

	let queueMesages = await context.awsSqsClient.send(
		new ReceiveMessageCommand({
			QueueUrl: context.queueUrl,
			MaxNumberOfMessages: 10,
			MessageAttributeNames: ["executionId", "attempts", "taskId"],
		}),
	);

	expect(queueMesages.Messages).toBeUndefined();

	await setTimeout(5000);

	queueMesages = await context.awsSqsClient.send(
		new ReceiveMessageCommand({
			QueueUrl: context.queueUrl,
			MaxNumberOfMessages: 10,
			MessageAttributeNames: ["executionId", "attempts", "taskId"],
		}),
	);

	assert(queueMesages.Messages);

	expect(queueMesages.Messages.length).toBe(1);

	expect(
		queueMesages.Messages.map((m) => ({
			body: JSON.parse(m.Body ?? ""),
			executionId: m.MessageAttributes!["executionId"]?.StringValue,
			taskId: m.MessageAttributes!["taskId"]?.StringValue,
			attempts: m.MessageAttributes!["attempts"]?.StringValue,
		})),
	).toStrictEqual([
		{
			body: { hello: "world" },
			executionId: messageId,
			attempts: "1",
			taskId: kebabCase(context.task.id),
		},
	]);
});

test<TaskSQSWorkerContext>("send tasks in bulk", async (context) => {
	const testTask = { id: kebabCase(context.task.id) } as Task<unknown>;

	const messageIds = await dispatcher(
		testTask,
		[
			{
				hello: "world",
			},
			{
				hello: "planet",
			},
		],
		{},
	);

	const queueMesages = await context.awsSqsClient.send(
		new ReceiveMessageCommand({
			QueueUrl: context.queueUrl,
			MaxNumberOfMessages: 10,
			MessageAttributeNames: ["executionId", "attempts", "taskId"],
		}),
	);

	assert(queueMesages.Messages);
	expect(queueMesages.Messages.length).toBe(2);

	expect(
		queueMesages.Messages.map((m) => ({
			body: JSON.parse(m.Body ?? ""),
			executionId: m.MessageAttributes!["executionId"]?.StringValue,
			taskId: m.MessageAttributes!["taskId"]?.StringValue,
			attempts: m.MessageAttributes!["attempts"]?.StringValue,
		})),
	).toStrictEqual([
		{
			body: { hello: "world" },
			executionId: messageIds[0],
			attempts: "1",
			taskId: kebabCase(context.task.id),
		},
		{
			body: { hello: "planet" },
			executionId: messageIds[1],
			attempts: "1",
			taskId: kebabCase(context.task.id),
		},
	]);
});
