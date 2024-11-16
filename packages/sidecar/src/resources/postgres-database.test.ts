import pg from "pg";
import { Equal, Expect } from "type-testing";
import { assert, expect } from "vitest";
import { PostgreSQLContainer } from "~sidecar/containers/postgresql.js";
import { PostgresDatabase } from "~sidecar/resources/postgres-database.js";
import { assertContainerImage } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test("PostgreSQL client commands against test container", async ({
	containers,
}) => {
	const postgreSQL = new PostgresDatabase(
		"test_commands",
		(connectionStringEnvVar) =>
			new pg.Pool({
				connectionString: process.env[connectionStringEnvVar],
			}),
		{ serverId: "server_one" },
	);

	const container = new PostgreSQLContainer(postgreSQL);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	const adminPool = new pg.Pool({
		connectionString: process.env[postgreSQL.connectionStringEnvVar()]?.replace(
			"/test_commands",
			"",
		),
	});
	await adminPool.query("CREATE DATABASE test_commands");
	const result = await postgreSQL.client.query("SELECT 1");
	assert.deepStrictEqual(result.rows, [{ "?column?": 1 }]);
	await postgreSQL.client.end();
	await adminPool.end();
});

test(
	"PostgreSQL with custom image tag container",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const postgres = new PostgresDatabase(
			"pg-custom-image-tag",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
			{ serverId: "server_one" },
		);

		PostgresDatabase.containerImage = "postgres:16.5";
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
	const postgreSQL = new PostgresDatabase(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			new pg.Pool({
				connectionString: process.env[connectionStringEnvVar],
			}),
		{ serverId: "server_one" },
	);

	type ClientType = typeof postgreSQL.client;
	type ExpectedType = pg.Pool;
	const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
	expect(isEqual).toBe(true);
});

test("build", async () => {
	const postgreSQL = new PostgresDatabase(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			new pg.Pool({
				connectionString: process.env[connectionStringEnvVar],
			}),
		{ serverId: "server_one" },
	);

	const buildOutput = postgreSQL.build();
	assert.deepStrictEqual(buildOutput, {
		kind: "postgresql",
		id: "server-one",
		connectionStringEnvVar: "SIDECAR_POSTGRESQL_SERVER_ONE_URL",
	});
});

test("build without server id", async () => {
	const postgreSQL = new PostgresDatabase(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			new pg.Pool({
				connectionString: process.env[connectionStringEnvVar],
			}),
	);

	const buildOutput = postgreSQL.build();
	assert.deepStrictEqual(buildOutput, {
		kind: "postgresql",
		id: "app-db",
		connectionStringEnvVar: "SIDECAR_POSTGRESQL_APP_DB_URL",
	});
});
