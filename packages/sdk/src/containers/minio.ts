import { kebabCase } from "case-anything";
import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import { type WorkloadContainerDefinition } from "~workloads/containers/container.js";
import { assertBucket } from "~workloads/workloads/assertions.js";
import type { Bucket } from "~workloads/workloads/stateful/bucket.js";

/**
 * Container for LocalStack
 *
 * @private
 */
export class MinioContainer extends ContainerWithURI {
	#testContainer: boolean;
	/**
	 * @hideconstructor
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(workload: Bucket<any>, options?: { test?: boolean }) {
		super(workload);
		this.#testContainer = options?.test ?? false;
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "minio/minio",
		portsToExpose: [9000, 9001],
		environment: {},
		healthCheck: {
			test: ["CMD", "mc", "ready", "local"],
			interval: 1000,
			retries: 5,
			startPeriod: 1000,
		} satisfies HealthCheck,
		waitStrategy: Wait.forAll([Wait.forHttp("/minio/health/live", 9000)]),
		command: ["server", "--console-address", `:${9001}`, "/data"],
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
		return kebabCase(!this.#testContainer ? `minio` : `minio-test`);
	}

	async afterStart() {
		await super.afterStart();
		const gatewayURL = this.gatewayURL;
		if (gatewayURL) {
			assertBucket(this.workload);
			if (this.startedContainer) {
				await this.startedContainer.exec(
					`mc mb --ignore-existing data/${[
						this.workload.id,
						this.#testContainer ? "test" : "development",
					].join("-")}`,
				);
				if (Object.keys(this.workload.publicAccess).length !== 0) {
					await this.startedContainer.exec(
						`mc alias set myminio http://localhost:9000 minioadmin minioadmin`,
					);

					for (const [path, grants] of Object.entries(
						this.workload.publicAccess,
					)) {
						for (const grant of grants) {
							await this.startedContainer.exec(
								`mc anonymous set ${grant === "write" ? "upload" : "download"} myminio/${[
									this.workload.id,
									this.#testContainer ? "test" : "development",
								].join("-")}/${path}`,
							);
						}
					}
				}
			}
		}
	}
}
