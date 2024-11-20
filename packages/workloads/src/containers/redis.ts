import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~sidecar/containers/container.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";

const redisContainerSpec: WorkloadContainerDefinition = {
	containerImage: "redis:7.4.1-alpine3.20",
	portsToExpose: [6379],
	environment: {
		REDIS_ARGS: "--save 1 1 --appendonly yes",
	},
};

/**
 * Container for Redis
 *
 * @internal
 */
export class RedisContainer<C> extends ContainerWithURI {
	constructor(workload: Redis<C>) {
		super(workload, redisContainerSpec);
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "redis://");
		url.hostname = container.getHost();
		url.port = container
			.getMappedPort(this.containerOptions.portsToExpose[0]!)
			.toString();
		return url.toString();
	}
}
