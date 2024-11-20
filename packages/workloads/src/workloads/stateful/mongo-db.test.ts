import { assert } from "vitest";
import { Database } from "~workloads/workloads/stateful/database.js";
import { MongoDb } from "~workloads/workloads/stateful/mongo-db.js";
import { test } from "~test/__setup__/container-test.js";

test("MongoDb is a StatefulWorkloadWithClient", () => {
	assert(MongoDb.prototype instanceof Database);
});

test("ElasticSearch connection string name", () => {
	const mongoDb = new MongoDb("products", {
		databaseId: "main",
		client: () => true,
	});
	assert.strictEqual(
		mongoDb.connectionStringEnvVar,
		"WL_MONGODB_MAIN_PRODUCTS_URL",
	);
});
