import {
	Container,
	type SidecarContainer,
	type SidecarContainerSpec,
	type StartOptions,
} from "~sidecar/containers/container.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";

const REDIS_SERVER_PORT = 6379;
const REDIS_WEBUI_PORT = 8001;

const redisContainerSpec = {
	containerImage: "redis/redis-stack:latest",
	portsToExpose: [REDIS_SERVER_PORT, REDIS_WEBUI_PORT],
	environment: {
		REDIS_ARGS: "--save 1 1 --appendonly yes",
	},
	persistentVolumeTargets: ["/data"],
};

/**
 * Container for Redis
 */
export class RedisContainer<C> extends Container implements SidecarContainer {
	#workload: Redis<C>;

	/**
	 * @hideconstructor
	 */
	constructor(workload: Redis<C>, options?: Partial<SidecarContainerSpec>) {
		super({
			workload,
			containerSpec: {
				...redisContainerSpec,
				...(options ? options : {}),
			},
		});
		this.#workload = workload;
	}

	override async start(options?: StartOptions) {
		const startedContainer = await super.start(
			options ?? {
				persistenceVolumes: true,
				reuse: true,
			},
		);
		const url = new URL("", "redis://");
		url.hostname = startedContainer.getHost();
		url.port = startedContainer.getMappedPort(REDIS_SERVER_PORT).toString();
		process.env[this.#workload.connectionStringEnvVar()] = url.toString();
		return startedContainer;
	}

	/**
	 * @returns The Redis server connection string URI in the form of `redis://host:port`
	 * or `undefined` if the container has not started.
	 */
	get connectionURI() {
		if (this.startedContainer) {
			const url = new URL("", "redis://");
			url.hostname = this.startedContainer.getHost();
			url.port = this.startedContainer
				.getMappedPort(REDIS_SERVER_PORT)
				.toString();
			return url.toString();
		}
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
