import {
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { ElasticSearchContainer } from "~sidecar/containers/elastic-search.js";
import { ElasticSearch } from "~sidecar/workloads/stateful/elastic-search.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

const elastic = new ElasticSearch("elastic-test", () => true);

test(
	"ElasticSearch container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new ElasticSearchContainer(elastic);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"elasticsearch-elastic-test",
		);
		await assertExposedPorts({
			container: startedContainer,
			ports: [9200],
		});

		assert.strictEqual(
			process.env.WL_ELASTIC_SEARCH_ELASTIC_TEST_URL,
			`http://localhost:${startedContainer.getMappedPort(9200)}/`,
		);
		assert.strictEqual(
			container.connectionURI,
			`http://localhost:${startedContainer.getMappedPort(9200)}/`,
		);
	},
);

test(
	"ElasticSearch with custom image tag container",
	{ sequential: true },
	async ({ containers }) => {
		const redisWorkload = new ElasticSearch("rd-custom-image-tag", () => true);

		redisWorkload.containerOptions({
			imageName: "elasticsearch:7.17.7",
		});

		const container = new ElasticSearchContainer(redisWorkload);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);
		await assertContainerImage({
			workload: redisWorkload,
			expectedImage: "elasticsearch:7.17.7",
		});
		await startedContainer.stop();
	},
);
