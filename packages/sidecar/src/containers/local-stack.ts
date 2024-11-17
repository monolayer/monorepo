import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";

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
export class LocalStackContainer extends ContainerWithURI {
	/**
	 * @hideconstructor
	 */
	constructor(workload: LocalStack, options?: LocalStackContainerOptions) {
		super(workload, {
			...localStackContainerSpec,
			containerImage:
				options?.containerImage ?? localStackContainerSpec.containerImage,
			environment: {
				...localStackContainerSpec.environment,
				PERSIST: (options?.persist ?? false) ? "1" : "0",
			},
		});
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "http://base.com");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(LOCAL_STACK_GATEWAY_PORT).toString();
		return url.toString();
	}
	/**
	 * @returns The LocalStack gateway URL.
	 */
	get gatewayURL() {
		if (this.startedContainer) {
			return this.buildConnectionURI(this.startedContainer);
		}
	}
}
