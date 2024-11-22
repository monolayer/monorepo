import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { MongoDb } from "~workloads/workloads/stateful/mongo-db.js";

test("MongoDb is a Database", () => {
	expect(MongoDb.prototype).toBeInstanceOf(Database);
});

test("connStringComponents", async () => {
	const mongoDb = new MongoDb("contracts", {
		databaseId: "documents",
		client: () => true,
	});
	expect(mongoDb.connStringComponents).toStrictEqual([
		"mongodb",
		"documents",
		"contracts",
		"database",
	]);
});
