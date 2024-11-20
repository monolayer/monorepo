import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import type { ElasticSearch } from "~sidecar/workloads/stateful/elastic-search.js";

const ELASTIC_SEARCH_HTTP_PORT = 9200;

const elasticSearchContainerSpec = {
	containerImage: "elasticsearch:7.17.25",
	portsToExpose: [ELASTIC_SEARCH_HTTP_PORT],
	environment: {
		"discovery.type": "single-node",
	},
	healthCheck: {
		test: [
			"CMD-SHELL",
			"curl --silent --fail localhost:9200/_cluster/health || exit 1",
		],
		interval: 1000,
		retries: 5,
		startPeriod: 500,
	} satisfies HealthCheck,
	waitStrategy: Wait.forHealthCheck(),
	contentsToCopy: [
		{
			content: "-Xmx2G\n",
			target:
				"/usr/share/elasticsearch/config/jvm.options.d/elasticsearch-default-memory-vm.options",
		},
	],
};

/**
 * Container for ElasticSearch
 *
 * @internal
 */
export class ElasticSearchContainer<C> extends ContainerWithURI {
	constructor(workload: ElasticSearch<C>) {
		super(workload, elasticSearchContainerSpec);
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "http://base.com");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(ELASTIC_SEARCH_HTTP_PORT).toString();
		return url.toString();
	}
}
