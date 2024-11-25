import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { MongoDatabase } from "~workloads/workloads/stateful/mongo-database.js";

test("MongoDatabase is a Database", () => {
	expect(MongoDatabase.prototype).toBeInstanceOf(Database);
});

test("connStringComponents", async () => {
	const mongoDb = new MongoDatabase("contracts", {
		serverId: "documents",
		client: () => true,
	});
	expect(mongoDb.connStringComponents).toStrictEqual([
		"mongodb",
		"documents",
		"contracts",
		"database",
	]);
});
