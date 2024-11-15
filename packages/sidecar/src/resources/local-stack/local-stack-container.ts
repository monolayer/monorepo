import { kebabCase, snakeCase } from "case-anything";
import { cwd } from "node:process";
import path from "path";
import {
	Container,
	type SidecarContainer,
	type StartOptions,
} from "~sidecar/container.js";
import type { LocalStack } from "~sidecar/resources/local-stack/local-stack.js";

const LOCAL_STACK_GATEWAY_PORT = 4566;

/**
 * Container for LocalStack
 *
 * @private
 */
export class LocalStackContainer extends Container implements SidecarContainer {
	/**
	 * @hideconstructor
	 */
	constructor(resource: LocalStack, name: string) {
		super({
			resourceId: resource.id,
			name: snakeCase(`local_stack_${name}`),
			image: {
				name: resource.containerImageName,
				tag: resource.containerImageTag,
			},
			portsToExpose: [LOCAL_STACK_GATEWAY_PORT],
			persistenceVolumes: [
				{
					source: path.join(
						cwd(),
						"tmp",
						"container-volumes",
						kebabCase(`${name}-data`),
					),
					target: "/var/lib/localstack",
				},
			],
		});
		this.withEnvironment({
			SERVICES: "s3",
			PERSISTENCE: "1",
		});
	}

	override async start(options?: StartOptions) {
		if (this.startedContainer === undefined) {
			this.startedContainer = await super.start(
				options ?? {
					persistenceVolumes: true,
					reuse: true,
				},
			);
		}
		return this.startedContainer;
	}

	/**
	 * Returns the server connection string URL.
	 */
	get gatewayURL() {
		if (this.startedContainer) {
			const url = new URL("", "http://base.com");
			url.hostname = this.startedContainer.getHost();
			url.port = this.startedContainer
				.getMappedPort(LOCAL_STACK_GATEWAY_PORT)
				.toString();
			return url.toString();
		}
	}
}
