import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";

const REDIS_SERVER_PORT = 6379;

const redisContainerSpec = {
	containerImage: "redis:7.4.1-alpine3.20",
	portsToExpose: [REDIS_SERVER_PORT],
	environment: {
		REDIS_ARGS: "--save 1 1 --appendonly yes",
	},
};

/**
 * Container for Redis
 *
 * @internals
 */
export class RedisContainer<C> extends ContainerWithURI {
	constructor(workload: Redis<C>) {
		super(workload, redisContainerSpec);
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "redis://");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(REDIS_SERVER_PORT).toString();
		return url.toString();
	}
}
