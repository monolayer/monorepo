import pg from "pg";
import { createClient } from "redis";
import { assert } from "vitest";
import { PostgresDatabase } from "~sidecar/resources.js";
import { Bucket } from "~sidecar/resources/bucket.js";
import { Redis } from "~sidecar/resources/redis.js";
import { startTestContainer } from "~sidecar/testing/start-test-container.js";
import {
	assertBucket,
	assertContainerImage,
	assertDatabase,
	assertStartedContainerLabel,
} from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test("launches redis", { sequential: true }, async ({ containers }) => {
	const redisResource = new Redis("launch-redis", (connectionStringEnvVar) =>
		createClient({
			url: process.env[connectionStringEnvVar],
		}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	const startedContainer = await startTestContainer(redisResource);
	containers.push(startedContainer);
	assertStartedContainerLabel(
		startedContainer,
		"org.monolayer-sidecar.resource-id",
		"launch-redis",
	);
	await assertContainerImage({
		resource: redisResource,
		expectedImage: "redis/redis-stack:latest",
	});
});

test("creates buckets", { sequential: true }, async ({ containers }) => {
	const names = [
		"my-bucket-test-1",
		"my-bucket-test-2",
		"my-bucket-test-3",
		"my-bucket-test-4",
	];
	for (const name of names) {
		const bucketResource = new Bucket(name);
		const startedContainer = await startTestContainer(bucketResource);
		containers.push(startedContainer);
	}

	await assertBucket("my-bucket-test-1");
	await assertBucket("my-bucket-test-2");
	await assertBucket("my-bucket-test-3");
	await assertBucket("my-bucket-test-4");
});

test(
	"launches postgres and creates multiple databases in the same container",
	{ sequential: true, retry: 2, timeout: 30000 },
	async ({ containers }) => {
		const postgresDatabase = new PostgresDatabase(
			"launch_postgres_same_container",
			"app_db_container",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		);

		const startedContainer = await startTestContainer(postgresDatabase);
		containers.push(startedContainer);
		await assertDatabase(postgresDatabase);

		const anotherDatabase = new PostgresDatabase(
			"another_database_same_container",
			"app_db_container",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		);
		const anotherDatabaseContainer = await startTestContainer(anotherDatabase);
		containers.push(anotherDatabaseContainer);

		await assertDatabase(anotherDatabase);

		assert.strictEqual(
			startedContainer.getName(),
			anotherDatabaseContainer.getName(),
		);
	},
);

test(
	"launches postgres and creates multiple databases in different container",
	{ sequential: true, retry: 2, timeout: 30000 },
	async ({ containers }) => {
		const postgresDatabase = new PostgresDatabase(
			"launch_postgres_different_container",
			"app_db_multiple_one",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		);

		const startedContainer = await startTestContainer(postgresDatabase);
		containers.push(startedContainer);
		await assertDatabase(postgresDatabase);

		const anotherDatabase = new PostgresDatabase(
			"another_database_different_container",
			"app_db_multiple_two",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		);
		const anotherDatabaseContainer = await startTestContainer(anotherDatabase);
		containers.push(anotherDatabaseContainer);

		await assertDatabase(anotherDatabase);

		assert.notStrictEqual(
			startedContainer.getName(),
			anotherDatabaseContainer.getName(),
		);
	},
);
