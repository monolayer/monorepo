import {
	Container,
	type SidecarContainer,
	type StartOptions,
} from "~sidecar/containers/container.js";
import { LocalStack } from "~sidecar/workloads/local-stack.js";

const LOCAL_STACK_GATEWAY_PORT = 4566;

interface LocalStackContainerOptions {
	/**
	 * @defaultValue `true`
	 */
	publishToRandomPorts?: boolean;
	/**
	 * @defaultValue `false`
	 */
	persist?: boolean;
	containerImage?: string;
}

const localStackContainerSpec = {
	/**
	 * Docker image for container
	 *
	 * @defaultValue `localstack/localstack:latest`
	 */
	containerImage: "localstack/localstack:latest",

	/**
	 * Container ports to export to the host.
	 *
	 * The published ports to the host will be assigned randomly when starting the container
	 * and they can be accessed through {@link Container.mappedPorts}
	 *
	 */
	portsToExpose: [LOCAL_STACK_GATEWAY_PORT],
	environment: {
		SERVICES: "s3",
		PERSISTENCE: "0",
	},
	persistentVolumeTargets: ["/var/lib/localstack"],
};

/**
 * Container for LocalStack
 *
 * @private
 */
export class LocalStackContainer extends Container implements SidecarContainer {
	/**
	 * @hideconstructor
	 */
	constructor(workload: LocalStack, options?: LocalStackContainerOptions) {
		super({
			workload: workload,
			containerSpec: {
				...localStackContainerSpec,
				containerImage:
					options?.containerImage ?? localStackContainerSpec.containerImage,
				environment: {
					...localStackContainerSpec.environment,
					PERSIST: (options?.persist ?? false) ? "1" : "0",
				},
			},
			publishToRandomPorts: options?.publishToRandomPorts ?? true,
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
	 * @returns The LocalStack gateway URL.
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
