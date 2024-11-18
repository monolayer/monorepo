/**
 * @module containers
 */

import getPort from "get-port";
import {
	GenericContainer,
	type StartedTestContainer,
	type WaitStrategy,
} from "testcontainers";
import type { Environment, HealthCheck } from "testcontainers/build/types.js";
import type { Workload } from "~sidecar/workloads.js";

export interface ContainerImage {
	/**
	 * Docker image name.
	 */
	name: string;
	/**
	 * Docker image tag.
	 */
	tag: string;
}

export interface ContainerPersistenceVolume {
	/**
	 * Source path in the host file system.
	 */
	source: string;
	/**
	 * Target path in the container file system.
	 */
	target: string;
}

export interface ContainerOptions {
	workload: Workload;
	containerSpec: WorkloadContainerOptions;
}

export interface StartOptions {
	/**
	 * Whether to reuse an already running container the same configuration
	 * and not launch a new container.
	 *
	 * @default true
	 */
	reuse?: boolean;
	/**
	 * Whether to publish the exposed ports to random host ports.
	 *
	 * @default false
	 */
	publishToRandomPorts?: boolean;
}

/**
 * @hidden
 */
export const CONTAINER_LABEL_WORKLOAD_ID = "org.monolayer-sidecar.workload-id";
/**
 * @hidden
 */
export const CONTAINER_LABEL_ORG = "org.monolayer-sidecar";

/**
 * @module containers
 */
export class WorkloadContainer {
	/**
	 * The started container
	 *
	 * @defaultValue `undefined`
	 */
	startedContainer?: StartedTestContainer;

	constructor(
		public workload: Workload,
		public containerOptions: WorkloadContainerOptions,
	) {}

	/**
	 * Starts the container.
	 */
	async start(options?: StartOptions) {
		const container = await this.#prepareContainer(options);
		this.startedContainer = await container.start();
		return this.startedContainer;
	}

	/**
	 * Stops the container.
	 */
	async stop() {
		await this.startedContainer?.stop();
		this.startedContainer = undefined;
	}

	get mappedPorts() {
		if (this.startedContainer) {
			const startedContainer = this.startedContainer;
			return (this.containerOptions.portsToExpose ?? []).map<MappedPort>(
				(port) => ({
					container: port,
					host: startedContainer.getMappedPort(port),
				}),
			);
		}
	}

	async #prepareContainer(startOptions?: StartOptions) {
		const container = new GenericContainer(
			this.containerOptions.containerImage,
		);
		container
			.withLabels({
				[CONTAINER_LABEL_WORKLOAD_ID]: this.workload.id,
				[CONTAINER_LABEL_ORG]: "true",
			})
			.withEnvironment(this.containerOptions.environment);
		if (this.containerOptions.waitStrategy) {
			container.withWaitStrategy(this.containerOptions.waitStrategy);
		}
		if (this.containerOptions.startupTimeout) {
			container.withStartupTimeout(this.containerOptions.startupTimeout);
		}
		if (this.containerOptions.healthCheck) {
			container.withHealthCheck(this.containerOptions.healthCheck);
		}
		for (const portToExpose of this.containerOptions.portsToExpose ?? []) {
			container.withExposedPorts({
				container: portToExpose,
				host:
					(startOptions?.publishToRandomPorts ?? false)
						? await getPort()
						: portToExpose,
			});
		}
		if (startOptions?.reuse ?? true) {
			container.withReuse();
		}
		return container;
	}
}

export interface MappedPort {
	/**
	 * Exposed container port
	 * */
	container: number;
	/**
	 * Published host port
	 * */
	host: number;
}

export interface WorkloadContainerOptions {
	/**
	 * Docker image for container
	 */
	containerImage: string;

	/**
	 * Container ports to export to the host.
	 *
	 * The published ports to the host will be assigned randomly when starting the container
	 * and they can be accessed through {@link Container.mappedPorts}
	 *
	 */
	portsToExpose: number[];
	environment: Environment;
	waitStrategy?: WaitStrategy;
	startupTimeout?: number;
	healthCheck?: HealthCheck;
}
