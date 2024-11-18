import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import {
	mergeOptions,
	type WorkloadContainerOptions,
} from "~sidecar/containers/container.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";

/**
 * Container for LocalStack
 *
 * @private
 */
export const LOCAL_STACK_GATEWAY_PORT = 4566;

/**
 * Container for LocalStack
 *
 * @private
 */
export const localStackContainerSpec = {
	containerImage: "localstack/localstack:latest",
	portsToExpose: [LOCAL_STACK_GATEWAY_PORT],
	environment: {
		SERVICES: "s3",
		PERSISTENCE: "0",
	},
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
	constructor(
		workload: LocalStack,
		options?: Partial<WorkloadContainerOptions>,
	) {
		super(workload, mergeOptions(localStackContainerSpec, options));
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
