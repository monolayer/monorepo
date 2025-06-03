import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";

test(
	"MySQL started container",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		if (process.env.CI) {
			return;
		}
		const mySqlDb = new MySqlDatabase("started_container");

		const container = new MySQLContainer(mySqlDb);
		const startedContainer = await container.start(true);
		containers.push(startedContainer);
		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-workloads.workload-id"],
			"mysqldatabase-started-container",
		);
		await assertExposedPorts({
			container: startedContainer,
			ports: [3306],
		});

		assert.strictEqual(
			process.env.ML_MYSQL_STARTED_CONTAINER_DATABASE_URL,
			`mysql://root:test@localhost:${startedContainer.getMappedPort(3306)}/started_container`,
		);
		assert.strictEqual(
			container.connectionURI,
			`mysql://root:test@localhost:${startedContainer.getMappedPort(3306)}/started_container`,
		);
	},
);
