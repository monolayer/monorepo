import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~workloads/containers/container.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";

/**
 * Container for Redis
 *
 * @internal
 */
export class RedisContainer extends ContainerWithURI {
	constructor(workload: Redis) {
		super(workload);
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "redis:7.4.1-alpine3.20",
		portsToExpose: [6379],
		environment: {
			REDIS_ARGS: "--save 1 1 --appendonly yes",
		},
	};

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "redis://");
		url.hostname = container.getHost();
		url.port = container
			.getMappedPort(this.definition.portsToExpose[0]!)
			.toString();
		return url.toString();
	}
}
