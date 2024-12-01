import getPort from "get-port";
import { Redis as IORedis } from "ioredis";
import mysql from "mysql2/promise";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { vi } from "vitest";
import type { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import { bullQueues } from "~workloads/workloads/stateless/task/bull.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postgresDatabasePool(workload: PostgresDatabase<any>) {
	return new pg.Pool({
		connectionString: process.env[workload.connectionStringEnvVar],
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mysqlConnection(workload: MySqlDatabase<any>) {
	return await mysql.createConnection(
		process.env[workload.connectionStringEnvVar]!,
	);
}

export interface BullContext<P> {
	container: StartedTestContainer;
	client: IORedis;
	testTask: Task<P>;
}

export async function setupBullContext<P>(
	context: BullContext<P>,
	task?: Task<P>,
) {
	context.container = await startRedisContainer();
	const url = redisConnectionString(context.container);
	vi.stubEnv("MONO_TASK_REDIS_URL", url);
	vi.stubEnv("NODE_ENV", "production");
	vi.stubEnv("MONO_TASK_MODE", "bull");
	context.client = new IORedis(url);
	context.testTask = task ?? new Task("Send emails", async () => {}, {});
}

export async function teardownBullContext<P>(context: BullContext<P>) {
	const queues = bullQueues;
	const keys = Object.keys(queues);
	for (const key of keys) {
		queues[key]?.close();
		delete queues[key];
	}
	if (context.client) {
		context.client.disconnect();
	}
	if (context.container) {
		await context.container.stop();
	}
}

export async function startRedisContainer() {
	const container = new GenericContainer("redis/redis-stack:latest");
	container.withExposedPorts(
		{
			container: 6379,
			host: await getPort(),
		},
		{
			container: 8001,
			host: await getPort(),
		},
	);
	const startedContainer = await container.start();
	return startedContainer;
}

export async function startLocalStackContainer() {
	const container = new GenericContainer("localstack/localstack:3.8.1");
	container.withExposedPorts({
		container: 4566,
		host: await getPort(),
	});
	const startedContainer = await container.start();
	return startedContainer;
}

export function redisConnectionString(startedContainer: StartedTestContainer) {
	const url = new URL("", "redis://");
	url.hostname = startedContainer.getHost();
	url.port = startedContainer.getMappedPort(6379).toString();
	return url.toString();
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
