import pg from "pg";
import { createClient } from "redis";
import { Equal, Expect } from "type-testing";
import { assert, expect } from "vitest";
import { PostgreSQLContainer } from "~sidecar/containers/postgresql.js";
import { PostgreSQL } from "~sidecar/resources/postgresql.js";
import { assertContainerImage } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test("PostgreSQL client commands against test container", async ({
	containers,
}) => {
	const postgreSQL = new PostgreSQL(
		"test-redis-client-commands",
		(connectionStringEnvVar) =>
			new pg.Pool({
				connectionString: process.env[connectionStringEnvVar],
			}),
	);

	const container = new PostgreSQLContainer(postgreSQL);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	const result = await postgreSQL.client.query("SELECT 1");
	assert.deepStrictEqual(result.rows, [{ "?column?": 1 }]);
	await postgreSQL.client.end();
});

test(
	"PostgreSQL with custom image tag container",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const postgres = new PostgreSQL(
			"pg-custom-image-tag",
			(connectionStringEnvVar) =>
				createClient({
					url: process.env[connectionStringEnvVar],
				}).on("error", (err) => console.error("PostgreSQL Client Error", err)),
		);

		PostgreSQL.containerImage = "postgres:16.5";
		const container = new PostgreSQLContainer(postgres);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertContainerImage({
			containerName: container.name,
			expectedImage: "postgres:16.5",
		});
		await startedContainer.stop();
	},
);

test("client type", async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const postgreSQL = new PostgreSQL(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			new pg.Pool({
				connectionString: process.env[connectionStringEnvVar],
			}),
	);

	type ClientType = typeof postgreSQL.client;
	type ExpectedType = pg.Pool;
	const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
	expect(isEqual).toBe(true);
});

test("build", async () => {
	const postgreSQL = new PostgreSQL(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			new pg.Pool({
				connectionString: process.env[connectionStringEnvVar],
			}),
	);

	const buildOutput = postgreSQL.build();
	assert.deepStrictEqual(buildOutput, {
		kind: "postgresql",
		id: "test-build-output",
		connectionStringEnvVar: "SIDECAR_POSTGRESQL_TEST_BUILD_OUTPUT_URL",
	});
});
