import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { ElasticSearchContainer } from "~workloads/containers/elastic-search.js";
import { ElasticSearch } from "~workloads/workloads/stateful/elastic-search.js";

const elastic = new ElasticSearch("elastic-test", () => true);

test(
	"ElasticSearch container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new ElasticSearchContainer(elastic);
		const startedContainer = await container.start();
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
			process.env.MONO_ELASTIC_SEARCH_ELASTIC_TEST_URL,
			`http://localhost:${startedContainer.getMappedPort(9200)}/`,
		);
		assert.strictEqual(
			container.connectionURI,
			`http://localhost:${startedContainer.getMappedPort(9200)}/`,
		);
	},
);
