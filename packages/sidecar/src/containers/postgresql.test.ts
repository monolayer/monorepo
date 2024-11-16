import { kebabCase } from "case-anything";
import { cwd } from "node:process";
import path from "path";
import pg from "pg";
import {
	assertBindMounts,
	assertContainer,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { PostgreSQLContainer } from "~sidecar/containers/postgresql.js";
import { PostgresDatabase } from "~sidecar/resources.js";
import { test } from "~test/__setup__/container-test.js";

const postgreSQL = new PostgresDatabase(
	"test_db",
	(connectionStringEnvVar) =>
		new pg.Pool({
			connectionString: process.env[connectionStringEnvVar],
		}),
	{ serverId: "server_one" },
);

test(
	"PostgreSQL started container name label",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(labels["org.monolayer-sidecar.name"], container.name);
		await assertContainer({ containerName: container.name });
	},
);

test(
	"PostgreSQL started container resource id label",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.resource-id"],
			"server-one",
		);
	},
);

test(
	"Bind mounts on a PostgreSQL container",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertBindMounts({
			containerName: container.name,
			bindMounts: [
				`${path.join(cwd(), "tmp", "container-volumes", kebabCase(`${container.name}-data`))}:/var/lib/postgresql/data:rw`,
			],
		});
	},
);

test(
	"Exposed ports of a PostgreSQL container",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertExposedPorts({
			container: startedContainer,
			ports: [5432],
		});
	},
);

test(
	"Assigned connection string to environment variable after start",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const postgreSQL = new PostgresDatabase(
			"test_db",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		);
		delete process.env.SIDECAR_POSTGRESQL_APP_DB_URL;
		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		assert.strictEqual(
			process.env.SIDECAR_POSTGRESQL_APP_DB_URL,
			`postgresql://postgres:postgres@localhost:${startedContainer.getMappedPort(5432)}/test_db`,
		);
	},
);

test(
	"Assigned connection string to environment variable after start with server id",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const postgreSQL = new PostgresDatabase(
			"test_db",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
			{ serverId: "server_one" },
		);
		delete process.env.SIDECAR_POSTGRESQL_SERVER_ONE_URL;
		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		assert.strictEqual(
			process.env.SIDECAR_POSTGRESQL_SERVER_ONE_URL,
			`postgresql://postgres:postgres@localhost:${startedContainer.getMappedPort(5432)}/test_db`,
		);
	},
);

test(
	"Connection string URI",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		assert.strictEqual(
			container.connectionURI,
			`postgresql://postgres:postgres@localhost:${startedContainer.getMappedPort(5432)}/test_db`,
		);
	},
);
