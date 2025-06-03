import {
	CreateQueueCommand,
	GetQueueAttributesCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import { Task } from "@monolayer/workloads";
import { snakeCase } from "case-anything";
import getPort from "get-port";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { createTable, deleteTable } from "tests/table.js";
import {
	afterAll,
	beforeAll,
	vi,
	type TaskContext,
	type TestContext,
} from "vitest";

export async function startLocalStackContainer() {
	const container = new GenericContainer("localstack/localstack:3.8.1");
	container.withExposedPorts({
		container: 4566,
		host: await getPort(),
	});
	const startedContainer = await container.start();
	return startedContainer;
}

export function localstackConnectionstring(
	startedContainer: StartedTestContainer,
) {
	const url = new URL("", "http://base.com");
	url.hostname = startedContainer.getHost();
	url.port = startedContainer.getMappedPort(4566).toString();
	return url.toString();
}

export function localStackSQSQueueUrl(
	queueUrlString: string,
	localStackConnectionString: string,
) {
	const localHostUrl = new URL(localStackConnectionString);
	const queueUrl = new URL(queueUrlString);
	localHostUrl.pathname = queueUrl.pathname;
	return localHostUrl.toString();
}

export function currentWorkingDirectory() {
	return path.resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export interface TaskSQSWorkerContext {
	queueUrl: string;
	deadLetterQueueUrl: string;
	container: StartedTestContainer;
	awsSqsClient: SQSClient;
}

export async function setupSqsQueueForWorker(
	context: TaskContext & TestContext & TaskSQSWorkerContext,
) {
	context.container = await startLocalStackContainer();
	const url = localstackConnectionstring(context.container);
	vi.stubEnv("AWS_ENDPOINT_URL_SQS", url);
	const client = new SQSClient();
	context.awsSqsClient = client;
	const testTask = new Task(context.task.id, async () => {}, {
		retry: {
			times: 2,
		},
	});

	const deadLetterQueue = await client.send(
		new CreateQueueCommand({
			QueueName: `${testTask.id}-dlq`,
		}),
	);

	context.deadLetterQueueUrl = localStackSQSQueueUrl(
		deadLetterQueue.QueueUrl!,
		url,
	);
	const deadLetterQueueArn = await client.send(
		new GetQueueAttributesCommand({
			QueueUrl: context.deadLetterQueueUrl,
			AttributeNames: ["QueueArn"],
		}),
	);
	const createQueue = new CreateQueueCommand({
		QueueName: testTask.id,
		Attributes: {
			RedrivePolicy: JSON.stringify({
				deadLetterTargetArn: deadLetterQueueArn.Attributes?.QueueArn,
				maxReceiveCount: testTask.options?.retry?.times,
			}),
		},
	});

	const result = await client.send(createQueue);
	context.queueUrl = localStackSQSQueueUrl(result.QueueUrl!, url);
	vi.stubEnv(
		`ML_TASK_${snakeCase(testTask.id).toUpperCase()}_SQS_QUEUE_URL`,
		context.queueUrl,
	);
}

export async function setupSqsQueueForSingleWorker(
	context: TaskContext & TestContext & TaskSQSWorkerContext,
) {
	context.container = await startLocalStackContainer();
	const url = localstackConnectionstring(context.container);
	vi.stubEnv("AWS_ENDPOINT_URL_SQS", url);
	const client = new SQSClient();
	const testTask = new Task(context.task.id, async () => {}, {
		retry: {
			times: 2,
		},
	});

	const deadLetterQueue = await client.send(
		new CreateQueueCommand({
			QueueName: `${testTask.id}-dlq`,
		}),
	);

	context.deadLetterQueueUrl = localStackSQSQueueUrl(
		deadLetterQueue.QueueUrl!,
		url,
	);
	const deadLetterQueueArn = await client.send(
		new GetQueueAttributesCommand({
			QueueUrl: context.deadLetterQueueUrl,
			AttributeNames: ["QueueArn"],
		}),
	);
	const createQueue = new CreateQueueCommand({
		QueueName: testTask.id,
		Attributes: {
			RedrivePolicy: JSON.stringify({
				deadLetterTargetArn: deadLetterQueueArn.Attributes?.QueueArn,
				maxReceiveCount: testTask.options?.retry?.times,
			}),
		},
	});

	const result = await client.send(createQueue);
	context.queueUrl = localStackSQSQueueUrl(result.QueueUrl!, url);
	vi.stubEnv(`ML_TASK_SQS_QUEUE_URL`, context.queueUrl);
}

export async function tearDownSqsQueueForWorker(
	context: TaskContext & TestContext & TaskSQSWorkerContext,
) {
	if (context.container) {
		await context.container.stop();
	}
}

process.env.DYNAMODB_TABLE_NAME = "task-sqs-adapter";

let startedTestContainer: StartedTestContainer;

beforeAll(async () => {
	try {
		const port = await getPort();
		const container = new GenericContainer("amazon/dynamodb-local:latest");
		container.withExposedPorts({
			container: 8000,
			host: port,
		});
		startedTestContainer = await container.start();
		process.env.AWS_ENDPOINT_URL_DYNAMODB = `http://localhost:${port}`;
		await deleteTable();
		await createTable();
	} catch (e) {
		console.error(e);
	}
});

afterAll(async () => {
	if (startedTestContainer) {
		await startedTestContainer.stop();
	}
});
