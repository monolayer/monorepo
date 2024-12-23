import { kebabCase } from "case-anything";
import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { createBucket } from "~workloads/containers/admin/create-bucket.js";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import { type WorkloadContainerDefinition } from "~workloads/containers/container.js";
import { assertBucket } from "~workloads/workloads/assertions.js";
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
		containerImage: "localstack/localstack:3.8.1",
		portsToExpose: [4566],
		environment: {
			SERVICES: "s3",
			PERSISTENCE: "1",
		},
		healthCheck: {
			test: ["CMD", "awslocal", "s3", "ls"],
			interval: 1000,
			retries: 5,
			startPeriod: 1000,
		} satisfies HealthCheck,
		waitStrategy: Wait.forHealthCheck(),
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

	async afterStart() {
		await super.afterStart();
		const gatewayURL = this.gatewayURL;
		if (gatewayURL) {
			assertBucket(this.workload);
			await createBucket(this.workload.id, gatewayURL);
		}
	}
}
