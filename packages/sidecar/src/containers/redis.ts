import { kebabCase } from "case-anything";
import { cwd } from "node:process";
import path from "path";
import {
	Container,
	type SidecarContainer,
	type StartOptions,
} from "~sidecar/containers/container.js";
import { randomName } from "~sidecar/containers/random-name.js";
import type { Redis } from "~sidecar/resources/redis.js";

const REDIS_SERVER_PORT = 6379;
const REDIS_WEBUI_PORT = 8001;

/**
 * Container for Redis
 */
export class RedisContainer<C> extends Container implements SidecarContainer {
	#resource: Redis<C>;

	/**
	 * @hideconstructor
	 */
	constructor(resource: Redis<C>) {
		const name = randomName();
		super({
			resourceId: resource.id,
			name,
			image: {
				name: resource.containerImageName,
				tag: resource.containerImageTag,
			},
			portsToExpose: [REDIS_SERVER_PORT, REDIS_WEBUI_PORT],
			persistenceVolumes: [
				{
					source: path.join(
						cwd(),
						"tmp",
						"container-volumes",
						kebabCase(`${name}-data`),
					),
					target: "/data",
				},
			],
		});
		this.withEnvironment({
			REDIS_ARGS: "--save 1 1 --appendonly yes",
		});
		this.#resource = resource;
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
		process.env[this.#resource.connectionStringEnvVar()] = url.toString();
		return startedContainer;
	}

	/**
	 * Returns the server connection string URL.
	 */
	get connectionStringURL() {
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
	 * Returns the web admin interface URL.
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
