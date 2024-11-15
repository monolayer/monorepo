import { kebabCase, snakeCase } from "case-anything";
import { cwd } from "node:process";
import path from "path";
import {
	Container,
	type SidecarContainer,
	type StartOptions,
} from "~sidecar/container.js";
import type { Redis } from "~sidecar/resources/redis/redis.js";

const REDIS_SERVER_PORT = 6379;
const REDIS_WEBUI_PORT = 8001;

export class RedisContainer<C> extends Container implements SidecarContainer {
	#resource: Redis<C>;

	constructor(resource: Redis<C>, name: string) {
		super({
			resourceId: resource.id,
			name: snakeCase(`redis_${name}`),
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
}
