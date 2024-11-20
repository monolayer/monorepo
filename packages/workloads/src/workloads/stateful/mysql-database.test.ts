import mysql from "mysql2/promise";
import type { Equal, Expect } from "type-testing";
import { assert, expect } from "vitest";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

test(
	"MySQL client commands against test container",
	{ timeout: 20000 },
	async ({ containers }) => {
		const mysqlDb = new MySqlDatabase("app_db", {
			databaseId: "mysql",
			client: async (connectionStringEnvVar) =>
				await mysql.createConnection(process.env[connectionStringEnvVar]!),
		});
		const container = new MySQLContainer(mysqlDb);
		const startedContainer = await startContainer(container, false);
		containers.push(startedContainer);

		const adminClient = await mysql.createConnection(
			process.env[mysqlDb.connectionStringEnvVar]!.replace("/app_db", ""),
		);

		await adminClient.query("CREATE DATABASE IF NOT EXISTS app_db;");

		const client = await mysqlDb.client;
		const result = await client.query("SELECT CURRENT_USER()");
		assert(result);
		await client.end();
	},
);

test("client type", async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const mysqlDb = new MySqlDatabase("app-db", {
		databaseId: "mysql",
		client: async (connectionStringEnvVar) =>
			await mysql.createConnection(process.env[connectionStringEnvVar]!),
	});

	type ClientType = typeof mysqlDb.client;
	type ExpectedType = Promise<mysql.Connection>;
	const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
	expect(isEqual).toBe(true);
});
