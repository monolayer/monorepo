import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { assert } from "vitest";
import { CONTAINER_LABEL_WORKLOAD_ID } from "~sidecar/containers/container.js";
import { LOCAL_STACK_GATEWAY_PORT } from "~sidecar/containers/local-stack.js";
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
		workload.id,
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

export async function assertBucket(
	bucketName: string,
	container: StartedTestContainer,
) {
	const url = new URL("", "http://base.com");
	url.hostname = container.getHost();
	url.port = container.getMappedPort(LOCAL_STACK_GATEWAY_PORT).toString();
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

export function assertStartedContainerLabel(
	startedContainer: StartedTestContainer,
	label: string,
	expected: string,
) {
	const labels = startedContainer.getLabels();
	assert.strictEqual(labels[label], expected);
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
