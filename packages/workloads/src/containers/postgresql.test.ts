import pg from "pg";
import {
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { PostgreSQLContainer } from "~sidecar/containers/postgresql.js";
import { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

test(
	"PostgreSQL started container",
	{ sequential: true },
	async ({ containers }) => {
		const postgreSQL = new PostgresDatabase("test_started_container", {
			databaseId: "test_app",
			client: (connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		});

		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);
		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"postgresdatabase-test-app",
		);
		await assertExposedPorts({
			container: startedContainer,
			ports: [5432],
		});

		assert.strictEqual(
			process.env.WL_POSTGRES_TEST_APP_TEST_STARTED_CONTAINER_URL,
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
		const postgres = new PostgresDatabase("pg-custom-image-tag", {
			databaseId: "db_custom_image",
			client: (connectionStringEnvVar) =>
				new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				}),
		});
		postgres.containerOptions({ imageName: "postgres:16.5" });

		const container = new PostgreSQLContainer(postgres);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);
		await assertContainerImage({
			workload: postgres,
			expectedImage: "postgres:16.5",
		});
		await startedContainer.stop();
	},
);
