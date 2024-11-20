import { kebabCase } from "case-anything";
import type Dockerode from "dockerode";
import { Pool } from "pg";
import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { assert } from "vitest";
import { CONTAINER_LABEL_WORKLOAD_ID } from "~sidecar/containers/container.js";
import type { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import type { Workload } from "~sidecar/workloads/workload.js";

export async function assertContainerImage({
	workload,
	expectedImage,
}: {
	workload: Workload;
	expectedImage: string;
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_WORKLOAD_ID,
		kebabCase(`${workload.constructor.name.toLowerCase()}-${workload.id}`),
		{ status: ["running"] },
	);

	assert(existingContainer, "Undefined container");
	const inspect = await existingContainer.inspect();

	assert.strictEqual(inspect.Config.Image, expectedImage);
}

export async function assertContainer({ workload }: { workload: Workload }) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_WORKLOAD_ID,
		workload.id,
		{ status: ["running"] },
	);

	assert(existingContainer, "Undefined container");
}

export async function assertBindMounts({
	workload,
	bindMounts,
}: {
	workload: Workload;
	bindMounts: string[];
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_WORKLOAD_ID,
		workload.id,
		{ status: ["running"] },
	);

	assert(existingContainer, "Undefined container");
	const inspection = await existingContainer?.inspect();
	assert(inspection);
	assert.deepStrictEqual(inspection["HostConfig"]["Binds"], bindMounts);
}

export async function assertExposedPorts({
	container,
	ports,
}: {
	container: StartedTestContainer;
	ports: number[];
}) {
	for (const port of ports) {
		assert.doesNotThrow(() => container.getMappedPort(port));
	}
}

export async function assertContainerLabel(
	container: Dockerode.Container,
	label: string,
	expected: string,
) {
	const inspect = await container.inspect();
	assert.strictEqual(inspect.Config.Labels[label], expected);
}

export async function assertDatabase<C>(resource: PostgresDatabase<C>) {
	const client = new Pool({
		connectionString: process.env[resource.connectionStringEnvVar]?.replace(
			/\/\w+$/,
			"",
		),
	});
	const result = await client.query(
		`SELECT datname FROM pg_database WHERE datname = '${resource.databaseName}'`,
	);
	await client.end();
	assert(
		result.rowCount !== 0,
		`Database "${resource.databaseName}" not found.`,
	);
}
