import mysql from "mysql2/promise";
import {
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

test(
	"MySQL started container",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		const mySqlDb = new MySqlDatabase("test_started_container", {
			databaseId: "container_test",
			client: async (connectionStringEnvVar) =>
				await mysql.createConnection(process.env[connectionStringEnvVar]!),
		});

		const container = new MySQLContainer(mySqlDb);
		const startedContainer = await startContainer(container);
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
			process.env.WL_MYSQL_CONTAINER_TEST_TEST_STARTED_CONTAINER_URL,
			`mysql://root:test@localhost:${startedContainer.getMappedPort(3306)}/test_started_container`,
		);
		assert.strictEqual(
			container.connectionURI,
			`mysql://root:test@localhost:${startedContainer.getMappedPort(3306)}/test_started_container`,
		);
	},
);

test(
	"MySQL with custom image tag container",
	{ sequential: true },
	async ({ containers }) => {
		const mySqlDb = new MySqlDatabase("test_started_container", {
			databaseId: "mysql_container_test",
			client: async (connectionStringEnvVar) =>
				await mysql.createConnection(process.env[connectionStringEnvVar]!),
		});

		mySqlDb.containerOptions({
			imageName: "mysql:8.4.2",
		});

		const container = new MySQLContainer(mySqlDb);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);
		await assertContainerImage({
			workload: mySqlDb,
			expectedImage: "mysql:8.4.2",
		});
		await startedContainer.stop();
	},
);
