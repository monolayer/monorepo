import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import { type SidecarContainerSpec } from "~sidecar/containers/container.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";

const REDIS_SERVER_PORT = 6379;
const REDIS_WEBUI_PORT = 8001;

const redisContainerSpec = {
	containerImage: "redis/redis-stack:latest",
	portsToExpose: [REDIS_SERVER_PORT, REDIS_WEBUI_PORT],
	environment: {
		REDIS_ARGS: "--save 1 1 --appendonly yes",
	},
};

/**
 * Container for Redis
 */
export class RedisContainer<C> extends ContainerWithURI {
	/**
	 * @hideconstructor
	 */
	constructor(workload: Redis<C>, options?: Partial<SidecarContainerSpec>) {
		super(workload, {
			...redisContainerSpec,
			...(options ? options : {}),
		});
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "redis://");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(REDIS_SERVER_PORT).toString();
		return url.toString();
	}

	/**
	 * @returns The Redis web admin interface URL or `undefined`
	 * if the container has not started.
	 */
	get webURL() {
		if (this.startedContainer) {
			const url = new URL("", "http://base.com");
			url.hostname = this.startedContainer.getHost();
			url.port = this.startedContainer
				.getMappedPort(REDIS_WEBUI_PORT)
				.toString();
			return url.toString();
		}
	}
}
