import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { PostgreSQLContainer } from "~workloads/containers/postgresql.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

test(
	"PostgreSQL started container",
	{ sequential: true },
	async ({ containers }) => {
		if (process.env.CI) {
			return;
		}
		const postgreSQL = new PostgresDatabase("test_started_container", {
			serverId: "test_app",
		});

		const container = new PostgreSQLContainer(postgreSQL);
		const startedContainer = await container.start(true);
		containers.push(startedContainer);
		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-workloads.workload-id"],
			"postgresdatabase-test-app",
		);
		await assertExposedPorts({
			container: startedContainer,
			ports: [5432],
		});

		assert.strictEqual(
			process.env.MONO_PG_TEST_APP_TEST_STARTED_CONTAINER_DATABASE_URL,
			`postgresql://postgres:postgres@localhost:${startedContainer.getMappedPort(5432)}/test_started_container`,
		);
		assert.strictEqual(
			container.connectionURI,
			`postgresql://postgres:postgres@localhost:${startedContainer.getMappedPort(5432)}/test_started_container`,
		);
	},
);
