import pg from "pg";
import { createClient } from "redis";
import { assert, describe } from "vitest";
import {
	assertContainerImage,
	assertContainerLabel,
	assertDatabase,
} from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";
import { startDevContainer } from "~workloads/containers/admin/dev-container.js";
import { getExistingContainer } from "~workloads/containers/admin/introspection.js";
import { startTestContainer } from "~workloads/containers/admin/start-test-container.js";
import { Bucket } from "~workloads/workloads/stateful/bucket.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";

test("launches redis", { sequential: true }, async ({ containers }) => {
	const redisWorkload = new Redis("launch-redis", (connectionStringEnvVar) =>
		createClient({
			url: process.env[connectionStringEnvVar],
		}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	await startTestContainer(redisWorkload);
	const container = await getExistingContainer(redisWorkload);
	assert(container);
	containers.push(container);

	await assertContainerLabel(
		container,
		"org.monolayer-sidecar.workload-id",
		"redis-launch-redis",
	);
	await assertContainerImage({
		workload: redisWorkload,
		expectedImage: "redis:7.4.1-alpine3.20",
	});
});

test(
	"launches postgres and creates multiple databases in different container for different workloads",
	{ sequential: true, timeout: 30000 },
	async ({ containers }) => {
		const postgresDatabase = new PostgresDatabase(
			"launch_postgres_different_container",
			{
				databaseId: "app_db_multiple_one",
				client: (connectionStringEnvVar) =>
					new pg.Pool({
						connectionString: process.env[connectionStringEnvVar],
					}),
			},
		);

		await startTestContainer(postgresDatabase);
		const container = await getExistingContainer(postgresDatabase);
		assert(container);
		containers.push(container);
		await assertDatabase(postgresDatabase);

		const anotherDatabase = new PostgresDatabase(
			"another_database_different_container",
			{
				databaseId: "app_db_multiple_two",
				client: (connectionStringEnvVar) =>
					new pg.Pool({
						connectionString: process.env[connectionStringEnvVar],
					}),
			},
		);
		await startTestContainer(anotherDatabase);
		const anotherContainer = await getExistingContainer(anotherDatabase);
		assert(anotherContainer);
		containers.push(anotherContainer);
		await assertDatabase(anotherDatabase);

		assert.notStrictEqual(anotherContainer.id, container.id);
	},
);

test(
	"launch different containers for the same workload",
	{ sequential: true },
	async ({ containers }) => {
		const redisWorkload = new Redis("red-one", (connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
		);

		await startTestContainer(redisWorkload);
		const container = await getExistingContainer(redisWorkload);
		assert(container);
		containers.push(container);

		await assertContainerLabel(
			container,
			"org.monolayer-sidecar.workload-id",
			"redis-red-one",
		);

		await startTestContainer(redisWorkload);
		const secondContainer = await getExistingContainer(redisWorkload);
		assert(secondContainer);
		containers.push(secondContainer);

		assert.notStrictEqual(container.id, secondContainer.id);
	},
);

test(
	"launch different containers for dev and test",
	{ sequential: true },
	async ({ containers }) => {
		const redisWorkload = new Redis("red-two", (connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
		);

		await startDevContainer(redisWorkload);

		const container = await getExistingContainer(redisWorkload);
		assert(container);
		containers.push(container);

		await assertContainerLabel(
			container,
			"org.monolayer-sidecar.workload-id",
			"redis-red-two",
		);

		await startTestContainer(redisWorkload);
		const secondContainer = await getExistingContainer(redisWorkload);
		assert(secondContainer);
		containers.push(secondContainer);

		assert.notStrictEqual(container.id, secondContainer.id);
	},
);

test(
	"Multiple workloads have the same container in dev",
	{ sequential: true },
	async ({ containers }) => {
		const bucket = new Bucket("bucket-one", () => true);
		const bucketStartedContainer = await startDevContainer(bucket);
		containers.push(bucketStartedContainer);

		const anotherBucket = new Bucket("bucket-two", () => true);
		const anotherBucketStartedContainer =
			await startDevContainer(anotherBucket);
		containers.push(anotherBucketStartedContainer);

		assert.strictEqual(
			bucketStartedContainer.getId(),
			anotherBucketStartedContainer.getId(),
		);
	},
);

describe("local stack", () => {
	test(
		"Multiple workloads have the same container in test",
		{ sequential: true },
		async ({ containers }) => {
			const bucket = new Bucket("bucket-one", () => true);
			await startTestContainer(bucket);
			const bucketStartedContainer = await getExistingContainer(bucket);
			assert(bucketStartedContainer);
			containers.push(bucketStartedContainer);

			const anotherBucket = new Bucket("bucket-two", () => true);
			await startTestContainer(anotherBucket);
			const anotherBucketStartedContainer = await getExistingContainer(bucket);
			assert(anotherBucketStartedContainer);

			assert.strictEqual(
				bucketStartedContainer.id,
				anotherBucketStartedContainer.id,
			);
		},
	);
});
