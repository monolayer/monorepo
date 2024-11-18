import pg from "pg";
import { createClient } from "redis";
import { assert } from "vitest";
import { startTestContainer } from "~sidecar/testing/start-test-container.js";
import { Bucket } from "~sidecar/workloads/stateful/bucket.js";
import { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";
import {
	assertBucket,
	assertContainerImage,
	assertDatabase,
	assertStartedContainerLabel,
} from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test("launches redis", { sequential: true }, async ({ containers }) => {
	const redisWorkload = new Redis("launch-redis", (connectionStringEnvVar) =>
		createClient({
			url: process.env[connectionStringEnvVar],
		}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	const startedContainer = await startTestContainer(redisWorkload);
	containers.push(startedContainer);
	assertStartedContainerLabel(
		startedContainer,
		"org.monolayer-sidecar.workload-id",
		"redis-launch-redis",
	);
	await assertContainerImage({
		workload: redisWorkload,
		expectedImage: "redis:7.4.1-alpine3.20",
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
		const bucketWorkload = new Bucket(name);
		const startedContainer = await startTestContainer(bucketWorkload);
		containers.push(startedContainer);
		await assertBucket("my-bucket-test-1", startedContainer);
	}
});

test(
	"launches postgres and creates multiple databases in different container",
	{ sequential: true, retry: 2, timeout: 30000 },
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

		const startedContainer = await startTestContainer(postgresDatabase);
		containers.push(startedContainer);
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
		const anotherDatabaseContainer = await startTestContainer(anotherDatabase);
		containers.push(anotherDatabaseContainer);

		await assertDatabase(anotherDatabase);

		assert.notStrictEqual(
			startedContainer.getName(),
			anotherDatabaseContainer.getName(),
		);
	},
);
