import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { kebabCase } from "case-anything";
import type Dockerode from "dockerode";
import { Pool } from "pg";
import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { assert } from "vitest";
import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import { CONTAINER_LABEL_WORKLOAD_ID } from "~sidecar/containers/container.js";
import { LOCAL_STACK_GATEWAY_PORT } from "~sidecar/containers/local-stack.js";
import type { Bucket } from "~sidecar/workloads/stateful/bucket.js";
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

export async function assertBucket(bucketName: string, bucketWorkload: Bucket) {
	const existingContainer = await getExistingContainer(bucketWorkload);
	assert(
		existingContainer,
		`Container not found for Bucket ${bucketWorkload.name}`,
	);
	const inspect = await existingContainer.inspect();
	const containerRuntimeClient = await getContainerRuntimeClient();

	assert(inspect.NetworkSettings.Ports);
	const portMappingKey = Object.keys(inspect.NetworkSettings.Ports ?? {}).find(
		(portAndProtocol) =>
			portAndProtocol.startsWith(String(LOCAL_STACK_GATEWAY_PORT)),
	);
	assert(portMappingKey, "Port mapping for container undefined");
	const portMapping = inspect.NetworkSettings.Ports[portMappingKey];
	assert(portMapping);

	const url = new URL("", "http://base.com");
	url.hostname = containerRuntimeClient.info.containerRuntime.host;
	url.port = String(portMapping[0]?.HostPort);

	const client = new S3Client({
		region: "us-west-2",
		forcePathStyle: true,
		endpoint: url.toString(),
	});

	const response = await client.send(
		new ListBucketsCommand({
			BucketRegion: "eu-west-2",
		}),
	);

	assert(response.Buckets);
	const buckets = response.Buckets.map((b) => b.Name);
	assert(buckets.includes(bucketName), `Bucket ${bucketName} not found`);
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
		connectionString: process.env[resource.connectionStringEnvVar()]?.replace(
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
