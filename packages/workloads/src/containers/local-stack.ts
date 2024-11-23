import { kebabCase } from "case-anything";
import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import { type WorkloadContainerDefinition } from "~workloads/containers/container.js";
import type { Bucket } from "~workloads/workloads/stateful/bucket.js";

/**
 * Container for LocalStack
 *
 * @private
 */
export class LocalStackContainer<C> extends ContainerWithURI {
	#testContainer: boolean;
	/**
	 * @hideconstructor
	 */
	constructor(workload: Bucket<C>, options?: { test?: boolean }) {
		super(workload);
		this.#testContainer = options?.test ?? false;
		if (this.#testContainer) {
			this.definition.environment = {
				SERVICES: "s3",
				PERSISTENCE: "0",
			};
		}
		this.definition.environment = {};
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "localstack/localstack:latest",
		portsToExpose: [4566],
		environment: {
			SERVICES: "s3",
			PERSISTENCE: "1",
		},
	};

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "http://base.com");
		url.hostname = container.getHost();
		url.port = container
			.getMappedPort(this.definition.portsToExpose[0]!)
			.toString();
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

	qualifiedWorkloadId() {
		return kebabCase(!this.#testContainer ? `local-stack` : `local-stack-test`);
	}
}
