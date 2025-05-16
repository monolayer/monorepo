import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

test("PostgresDatabase is a Database", () => {
	expect(PostgresDatabase.prototype).toBeInstanceOf(Database);
});

test("connStringComponents", async () => {
	const postgres = new PostgresDatabase("products", {
		serverId: "main",
	});
	expect(postgres.connStringComponents).toStrictEqual([
		"pg",
		"main",
		"products",
		"database",
	]);
});
