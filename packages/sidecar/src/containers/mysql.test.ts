import mysql from "mysql2/promise";
import { cwd } from "node:process";
import path from "path";
import {
	assertBindMounts,
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { MySQLContainer } from "~sidecar/containers/mysql.js";
import { MySqlDatabase } from "~sidecar/workloads/stateful/mysql-database.js";
import { test } from "~test/__setup__/container-test.js";

test(
	"MySQL started container",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		const mySqlDb = new MySqlDatabase(
			"test_started_container",
			"container_test",
			async (connectionStringEnvVar) =>
				await mysql.createConnection(process.env[connectionStringEnvVar]!),
		);

		const container = new MySQLContainer(mySqlDb);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"container_test",
		);
		await assertBindMounts({
			workload: mySqlDb,
			bindMounts: [
				`${path.join(cwd(), "tmp", "container-volumes", "my_sql_database", "container_test_data")}:/var/lib/mysql:rw`,
			],
		});
		await assertExposedPorts({
			container: startedContainer,
			ports: [3306],
		});

		assert.strictEqual(
			process.env.WL_MYSQL_CONTAINER_TEST_TEST_STARTED_CONTAINER_URL,
			`mysql://test:test@localhost:${startedContainer.getMappedPort(3306)}/test_started_container`,
		);
		assert.strictEqual(
			container.connectionURI,
			`mysql://root:test@localhost:${startedContainer.getMappedPort(3306)}/test_started_container`,
		);
	},
);

test(
	"PostgreSQL with custom image tag container",
	{ sequential: true },
	async ({ containers }) => {
		const mySqlDb = new MySqlDatabase(
			"test_started_container",
			"mysql_container_test",
			async (connectionStringEnvVar) =>
				await mysql.createConnection(process.env[connectionStringEnvVar]!),
		);

		const container = new MySQLContainer(mySqlDb, {
			containerImage: "mysql:8.4.2",
		});
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertContainerImage({
			workload: mySqlDb,
			expectedImage: "mysql:8.4.2",
		});
		await startedContainer.stop();
	},
);
