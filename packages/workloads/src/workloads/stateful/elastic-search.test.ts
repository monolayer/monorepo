import { assert } from "vitest";
import { ElasticSearch } from "~sidecar/workloads/stateful/elastic-search.js";
import { StatefulWorkloadWithClient } from "~sidecar/workloads/stateful/stateful-workload.js";
import { test } from "~test/__setup__/container-test.js";

test("ElasticSearch is a StatefulWorkloadWithClient", () => {
	assert(ElasticSearch.prototype instanceof StatefulWorkloadWithClient);
});

test("ElasticSearch connection string name", () => {
	const elastic = new ElasticSearch("products", () => true);

	assert.strictEqual(
		elastic.connectionStringEnvVar,
		"WL_ELASTIC_SEARCH_PRODUCTS_URL",
	);
});
