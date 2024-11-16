import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { assert } from "vitest";
import { containerStarter } from "~sidecar/containers/container-starter.js";
import { CONTAINER_LABEL_NAME } from "~sidecar/containers/container.js";
import type { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import type { PostgresDatabase } from "~sidecar/resources/postgres-database.js";

export async function assertContainerImage({
	containerName,
	expectedImage,
}: {
	containerName: string;
	expectedImage: string;
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_NAME,
		containerName,
		{ status: ["running"] },
	);

	assert(existingContainer, "Undefined container");
	const inspect = await existingContainer.inspect();

	assert.strictEqual(inspect.Config.Image, expectedImage);
}

export async function assertContainer({
	containerName,
}: {
	containerName: string;
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_NAME,
		containerName,
		{ status: ["running"] },
	);

	assert(existingContainer, "Undefined container");
}

export async function assertBindMounts({
	containerName,
	bindMounts,
}: {
	containerName: string;
	bindMounts: string[];
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_NAME,
		containerName,
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
	localStackContainer?: LocalStackContainer,
) {
	const client = new S3Client({
		region: "us-west-2",
		forcePathStyle: true,
		endpoint: localStackContainer
			? localStackContainer.gatewayURL
			: (await containerStarter.localStackContainer()).gatewayURL,
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
