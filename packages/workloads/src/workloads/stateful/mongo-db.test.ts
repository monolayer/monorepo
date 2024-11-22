import { assert, expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { MongoDb } from "~workloads/workloads/stateful/mongo-db.js";

test("MongoDb is a Database", () => {
	expect(MongoDb.prototype).toBeInstanceOf(Database);
});

test("ElasticSearch connection string name", () => {
	const mongoDb = new MongoDb("products", {
		databaseId: "main",
		client: () => true,
	});
	assert.strictEqual(
		mongoDb.connectionStringEnvVar,
		"MONO_MONGODB_MAIN_PRODUCTS_URL",
	);
});
