import mysql from "mysql2/promise";
import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";

test(
	"MySQL started container",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		const mySqlDb = new MySqlDatabase("test_started_container", {
			serverId: "container_test",
			client: async (connectionStringEnvVar) =>
				await mysql.createConnection(process.env[connectionStringEnvVar]!),
		});

		const container = new MySQLContainer(mySqlDb);
		const startedContainer = await container.start(true);
		containers.push(startedContainer);
		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"mysqldatabase-container-test",
		);
		await assertExposedPorts({
			container: startedContainer,
			ports: [3306],
		});

		assert.strictEqual(
			process.env.MONO_MYSQL_CONTAINER_TEST_TEST_STARTED_CONTAINER_DATABASE_URL,
			`mysql://root:test@localhost:${startedContainer.getMappedPort(3306)}/test_started_container`,
		);
		assert.strictEqual(
			container.connectionURI,
			`mysql://root:test@localhost:${startedContainer.getMappedPort(3306)}/test_started_container`,
		);
	},
);
