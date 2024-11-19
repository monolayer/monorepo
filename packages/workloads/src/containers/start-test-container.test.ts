import pg from "pg";
import { createClient } from "redis";
import { assert } from "vitest";
import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import { startTestContainer } from "~sidecar/containers/start-test-container.js";
import { Bucket } from "~sidecar/workloads/stateful/bucket.js";
import { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";
import {
	assertBucket,
	assertContainerImage,
	assertContainerLabel,
	assertDatabase,
} from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

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

	assertContainerLabel(
		container,
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
		await startTestContainer(bucketWorkload);
		const container = await getExistingContainer(bucketWorkload);
		assert(container);
		containers.push(container);
		await assertBucket("my-bucket-test-1", bucketWorkload);
	}
});

test(
	"launches postgres and creates multiple databases in different container",
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
