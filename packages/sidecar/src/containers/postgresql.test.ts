import { cwd } from "node:process";
import path from "path";
import pg from "pg";
import {
	assertBindMounts,
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { PostgreSQLContainer } from "~sidecar/containers/postgresql.js";
import { PostgresDatabase } from "~sidecar/resources.js";
import { test } from "~test/__setup__/container-test.js";

test(
	"PostgreSQL started container",
	{ sequential: true },
	async ({ containers }) => {
		const postgreSQL = new PostgresDatabase(
			"test_started_container",
			"app",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		);

		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		const labels = startedContainer.getLabels();
		assert.strictEqual(labels["org.monolayer-sidecar.resource-id"], "app");
		await assertBindMounts({
			resource: postgreSQL,
			bindMounts: [
				`${path.join(cwd(), "tmp", "container-volumes", "postgres_database", "app_data")}:/var/lib/postgresql/data:rw`,
			],
		});
		await assertExposedPorts({
			container: startedContainer,
			ports: [5432],
		});
		assert.strictEqual(
			process.env.SIDECAR_POSTGRESQL_APP_URL,
			`postgresql://postgres:postgres@localhost:${startedContainer.getMappedPort(5432)}/test_started_container`,
		);
		assert.strictEqual(
			container.connectionURI,
			`postgresql://postgres:postgres@localhost:${startedContainer.getMappedPort(5432)}/test_started_container`,
		);
	},
);

test(
	"PostgreSQL with custom image tag container",
	{ sequential: true },
	async ({ containers }) => {
		const postgres = new PostgresDatabase(
			"pg-custom-image-tag",
			"db_custom_image",
			(connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		);

		const container = new PostgreSQLContainer(postgres, {
			containerImage: "postgres:16.5",
		});
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertContainerImage({
			resource: postgres,
			expectedImage: "postgres:16.5",
		});
		await startedContainer.stop();
	},
);
