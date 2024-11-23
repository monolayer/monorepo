import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { MongoDbContainer } from "~workloads/containers/mongo-db.js";
import { MongoDb } from "~workloads/workloads/stateful/mongo-db.js";

test("MongoDb container", { sequential: true }, async ({ containers }) => {
	const mongoDb = new MongoDb("products", {
		databaseId: "container",
		client: () => true,
	});
	const container = new MongoDbContainer(mongoDb);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	const labels = startedContainer.getLabels();
	assert.strictEqual(
		labels["org.monolayer-sidecar.workload-id"],
		"mongodb-container",
	);
	await assertExposedPorts({
		container: startedContainer,
		ports: [27017],
	});

	assert.strictEqual(
		process.env.MONO_MONGODB_CONTAINER_PRODUCTS_DATABASE_URL,
		`http://localhost:${startedContainer.getMappedPort(27017)}/products`,
	);
	assert.strictEqual(
		container.connectionURI,
		`http://localhost:${startedContainer.getMappedPort(27017)}/products`,
	);
});
