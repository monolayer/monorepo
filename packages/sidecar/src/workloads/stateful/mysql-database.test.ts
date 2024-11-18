import mysql from "mysql2/promise";
import type { Equal, Expect } from "type-testing";
import { expect } from "vitest";
import { MySqlDatabase } from "~sidecar/workloads/stateful/mysql-database.js";
import { test } from "~test/__setup__/container-test.js";

test("client type", async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const mysqlDb = new MySqlDatabase(
		"app-db",
		"mysql",
		async (connectionStringEnvVar) =>
			await mysql.createConnection(process.env[connectionStringEnvVar]!),
	);

	type ClientType = typeof mysqlDb.client;
	type ExpectedType = Promise<mysql.Connection>;
	const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
	expect(isEqual).toBe(true);
});
