import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { ElasticSearch } from "~workloads/workloads/stateful/elastic-search.js";
import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

test("ElasticSearch is a StatefulWorkloadWithClient", () => {
	expect(ElasticSearch.prototype).toBeInstanceOf(StatefulWorkloadWithClient);
});

test("connStringComponents", async () => {
	const elastic = new ElasticSearch("listings", () => true);
	expect(elastic.connStringComponents).toStrictEqual([
		"elastic-search",
		"listings",
	]);
});
