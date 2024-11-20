import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~sidecar/containers/container.js";
import type { MongoDb } from "~sidecar/workloads/stateful/mongo-db.js";

/**
 * Container for ElasticSearch
 *
 * @internal
 */
export class MongoDbContainer<C> extends ContainerWithURI {
	constructor(workload: MongoDb<C>) {
		super(workload);
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "mongo:7.0.15",
		portsToExpose: [27017],
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

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "http://base.com");
		url.hostname = container.getHost();
		url.port = container
			.getMappedPort(this.definition.portsToExpose[0]!)
			.toString();
		url.pathname = (this.workload as MongoDb<C>).databaseName;
		return url.toString();
	}
}
