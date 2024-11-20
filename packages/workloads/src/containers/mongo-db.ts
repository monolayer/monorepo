import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import type { MongoDb } from "~sidecar/workloads/stateful/mongo-db.js";

const MONGODB_HTTP_PORT = 27017;

const mongoDbContainerSpec = {
	containerImage: "mongo:7.0.15",
	portsToExpose: [MONGODB_HTTP_PORT],
	environment: {
		"discovery.type": "single-node",
	},

	healthCheck: {
		test: ["CMD", "mongosh", "--host", "localhost:27017", "--eval", "1"],
		interval: 1000,
		retries: 5,
		startPeriod: 1000,
	} satisfies HealthCheck,
	waitStrategy: Wait.forHealthCheck(),
};

/**
 * Container for ElasticSearch
 *
 * @internal
 */
export class MongoDbContainer<C> extends ContainerWithURI {
	constructor(workload: MongoDb<C>) {
		super(workload, mongoDbContainerSpec);
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "http://base.com");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(MONGODB_HTTP_PORT).toString();
		url.pathname = (this.workload as MongoDb<C>).databaseName;
		return url.toString();
	}
}
