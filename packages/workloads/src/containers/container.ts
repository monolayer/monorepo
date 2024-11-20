/**
 * @module containers
 */

import { kebabCase } from "case-anything";
import getPort from "get-port";
import {
	GenericContainer,
	type StartedTestContainer,
	type WaitStrategy,
} from "testcontainers";
import type {
	ContentToCopy,
	Environment,
	HealthCheck,
} from "testcontainers/build/types.js";
import type { Workload } from "~sidecar/workloads.js";

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

export const defaultDevStartOptions: StartOptions = {
	reuse: true,
	publishToRandomPorts: false,
};

export const defaultTestStartOptions: StartOptions = {
	reuse: false,
	publishToRandomPorts: true,
};

/**
 * @hidden
 */
export const CONTAINER_LABEL_WORKLOAD_ID = "org.monolayer-sidecar.workload-id";
/**
 * @hidden
 */
export const CONTAINER_LABEL_ORG = "org.monolayer-sidecar";

/**
 * @internal
 */
export class WorkloadContainer {
	startedContainer?: StartedTestContainer;

	constructor(
		public workload: Workload,
		public containerOptions: WorkloadContainerDefinition,
	) {}

	/**
	 * Starts the container.
	 */
	async start() {
		const container = await this.#prepareContainer();
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

	/**
	 * @returns An array of published ports from the container to the host or `undefined`
	 * if the container has not started.
	 */
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

	async #prepareContainer() {
		const startOptions = {
			...defaultTestStartOptions,
			...(this.workload.containerOverrides?.startOptions ?? {}),
		};
		const container = new GenericContainer(
			this.workload.containerOverrides?.definition?.containerImage ??
				this.containerOptions.containerImage,
		);
		container.withLabels({
			[CONTAINER_LABEL_WORKLOAD_ID]: kebabCase(
				`${this.workload.constructor.name.toLowerCase()}-${this.workload.id}`,
			),
			[CONTAINER_LABEL_ORG]: "true",
		});

		container.withEnvironment(this.containerOptions.environment);

		if (this.containerOptions.waitStrategy) {
			container.withWaitStrategy(this.containerOptions.waitStrategy);
		}
		if (this.containerOptions.startupTimeout) {
			container.withStartupTimeout(this.containerOptions.startupTimeout);
		}
		if (this.containerOptions.healthCheck) {
			container.withHealthCheck(this.containerOptions.healthCheck);
		}
		if (this.containerOptions.contentsToCopy) {
			container.withCopyContentToContainer(
				this.containerOptions.contentsToCopy,
			);
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

export interface WorkloadContainerDefinition {
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
	contentsToCopy?: ContentToCopy[];
}

export function mergeOptions(
	base: WorkloadContainerDefinition,
	toMerge?: Partial<WorkloadContainerDefinition>,
) {
	return {
		...base,
		...toMerge,
	};
}

export interface ContainerOverrides {
	definition?: Partial<WorkloadContainerDefinition>;
	startOptions?: StartOptions;
}
