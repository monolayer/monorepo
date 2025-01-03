import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";

test("MySqlDatabase is a Database", () => {
	expect(MySqlDatabase.prototype).toBeInstanceOf(Database);
});

test("connStringComponents", async () => {
	const mysql = new MySqlDatabase("users", {
		serverId: "main",
		client: () => true,
	});
	expect(mysql.connStringComponents).toStrictEqual([
		"mysql",
		"main",
		"users",
		"database",
	]);
});
