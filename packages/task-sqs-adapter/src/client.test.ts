import { ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { kebabCase, snakeCase } from "case-anything";
import {
	setupSqsQueueForWorker,
	tearDownSqsQueueForWorker,
	type TaskSQSWorkerContext,
} from "tests/setup.js";
import { setTimeout } from "timers/promises";
import { afterEach, assert, beforeEach, expect, test, vi } from "vitest";
import { Task } from "~workloads/workloads/stateless/task/task.js";
import { SQSClient } from "./client.js";

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
	expect(context.queueUrl).toBe(
		process.env[
			`MONO_TASK_${snakeCase(context.task.id).toUpperCase()}_SQS_QUEUE_URL`
		],
	);
});

test<TaskSQSWorkerContext>("send tasks to queue", async (context) => {
	const testTask = new Task<Record<string, string>>(
		context.task.id,
		async (): Promise<void> => {},
		{
			onError() {},
		},
	);

	const client = new SQSClient();
	const firstMessageId = await client.sendTask(
		testTask,
		{},
		{ hello: "world" },
	);
	const secondMessageId = await client.sendTask(
		testTask,
		{},
		{
			hello: "planet",
		},
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
	const testTask = new Task<Record<string, string>>(
		context.task.id,
		async (): Promise<void> => {},
		{
			onError() {},
		},
	);
	const client = new SQSClient();

	const messageId = await client.sendTask(
		testTask,
		{ delay: 3000 },
		{
			hello: "world",
		},
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
	const testTask = new Task<Record<string, string>>(
		context.task.id,
		async (): Promise<void> => {},
		{
			onError() {},
		},
	);
	const client = new SQSClient();

	const messageIds = await client.sendTaskBatch(testTask, {}, [
		{
			hello: "world",
		},
		{
			hello: "planet",
		},
	]);

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
