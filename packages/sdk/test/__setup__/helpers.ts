import getPort from "get-port";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

export function postgresDatabasePool(workload: PostgresDatabase) {
	return new pg.Pool({
		connectionString: process.env[workload.connectionStringEnvVar],
	});
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
