import pg from "pg";
import { assert } from "vitest";
import { assertDatabase } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";
import { startContainer } from "~workloads/containers/admin/container.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

test(
	"launch different containers for dev and test",
	{ sequential: true },
	async ({ containers }) => {
		const mailer = new Mailer("test-mailer-one", () => true);

		const container = await startContainer(mailer, {
			mode: "dev",
			waitForHealthcheck: false,
		});

		const containerDevTwo = await startContainer(mailer, {
			mode: "dev",
			waitForHealthcheck: false,
		});

		assert.strictEqual(container.getId(), containerDevTwo.getId());

		containers.push(container);

		const containerTest = await startContainer(mailer, {
			mode: "test",
			waitForHealthcheck: false,
		});

		const containerTestTwo = await startContainer(mailer, {
			mode: "test",
			waitForHealthcheck: false,
		});

		containers.push(containerTest);

		assert.strictEqual(containerTest.getId(), containerTestTwo.getId());

		assert.notStrictEqual(container.getId(), containerTest.getId());
	},
);

test(
	"launches postgres and creates database",
	{ sequential: true, timeout: 30000 },
	async ({ containers }) => {
		const postgresDatabase = new PostgresDatabase(
			"launch_postgres_different_container",
			{
				serverId: "app_db_multiple_one",
				client: (connectionStringEnvVar) =>
					new pg.Pool({
						connectionString: process.env[connectionStringEnvVar],
					}),
			},
		);

		const container = await startContainer(postgresDatabase, {
			mode: "test",
			waitForHealthcheck: true,
		});
		containers.push(container);
		await assertDatabase(postgresDatabase);
	},
);
