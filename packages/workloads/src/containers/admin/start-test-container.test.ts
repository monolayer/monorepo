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

	const container = await startTestContainer(redisWorkload);
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

		const container = await startTestContainer(postgresDatabase, true);
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
		const anotherContainer = await startTestContainer(anotherDatabase, true);
		assert(anotherContainer);
		containers.push(anotherContainer);
		await assertDatabase(anotherDatabase);

		assert.notStrictEqual(anotherContainer.getId(), container.getId());
	},
);

test(
	"launch same containers for the same workload",
	{ sequential: true },
	async ({ containers }) => {
		const redisWorkload = new Redis("red-one", (connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
		);

		const container = await startTestContainer(redisWorkload);
		containers.push(container);

		await assertContainerLabel(
			container,
			"org.monolayer-sidecar.workload-id",
			"redis-red-one",
		);

		const secondContainer = await startTestContainer(redisWorkload);
		containers.push(secondContainer);

		assert.strictEqual(container.getId(), secondContainer.getId());
	},
);

test(
	"launch different containers for dev and test",
	{ sequential: true },
	async ({ containers }) => {
		const redisWorkload = new Redis(
			"redis-dev-test",
			(connectionStringEnvVar) =>
				createClient({
					url: process.env[connectionStringEnvVar],
				}).on("error", (err) => console.error("Redis Client Error", err)),
		);

		const container = await startDevContainer(redisWorkload);
		containers.push(container);

		await assertContainerLabel(
			container,
			"org.monolayer-sidecar.workload-id",
			"redis-redis-dev-test",
		);

		const secondContainer = await startTestContainer(redisWorkload);
		containers.push(secondContainer);

		assert.notStrictEqual(container.getId(), secondContainer.getId());
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
			const bucketStartedContainer = await startTestContainer(bucket);
			containers.push(bucketStartedContainer);

			const anotherBucket = new Bucket("bucket-two", () => true);
			const anotherBucketStartedContainer =
				await startTestContainer(anotherBucket);

			assert.strictEqual(
				bucketStartedContainer.getId(),
				anotherBucketStartedContainer.getId(),
			);
		},
	);
});
