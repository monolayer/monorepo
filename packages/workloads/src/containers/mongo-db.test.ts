import {
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { startContainer, test } from "~test/__setup__/container-test.js";
import { MongoDbContainer } from "~workloads/containers/mongo-db.js";
import { MongoDb } from "~workloads/workloads/stateful/mongo-db.js";

test("MongoDb container", { sequential: true }, async ({ containers }) => {
	const mongoDb = new MongoDb("products", {
		databaseId: "container",
		client: () => true,
	});
	const container = new MongoDbContainer(mongoDb);
	const startedContainer = await startContainer(container);
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
		process.env.MONO_MONGODB_CONTAINER_PRODUCTS_URL,
		`http://localhost:${startedContainer.getMappedPort(27017)}/products`,
	);
	assert.strictEqual(
		container.connectionURI,
		`http://localhost:${startedContainer.getMappedPort(27017)}/products`,
	);
});

test(
	"ElasticSearch with custom image tag container",
	{ sequential: true },
	async ({ containers }) => {
		const mongoDb = new MongoDb("products", {
			databaseId: "image",
			client: () => true,
		});
		const container = new MongoDbContainer(mongoDb);

		mongoDb.containerOptions({
			imageName: "mongo:7.0.14",
		});

		const startedContainer = await startContainer(container);
		containers.push(startedContainer);

		await assertContainerImage({
			workload: mongoDb,
			expectedImage: "mongo:7.0.14",
		});
		await startedContainer.stop();
	},
);
