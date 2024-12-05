import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~workloads/containers/container.js";
import type { MongoDatabase } from "~workloads/workloads/stateful/mongo-database.js";

/**
 * Container for MongoDatabase
 *
 * @internal
 */
export class MongoDatabaseContainer<C> extends ContainerWithURI {
	constructor(workload: MongoDatabase<C>) {
		super(workload);
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "mongo:7.0.15",
		portsToExpose: [27017],
		environment: {},
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
		url.pathname = (this.workload as MongoDatabase<C>).databaseName;
		return url.toString();
	}
}
