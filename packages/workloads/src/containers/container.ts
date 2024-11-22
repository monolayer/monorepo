/**
 * @module containers
 */

import { camelCase, kebabCase } from "case-anything";
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
import {
	workloadsConfiguration,
	type Configuration,
} from "~workloads/configuration.js";
import type { Workload } from "~workloads/workloads/workload.js";

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
export abstract class WorkloadContainer {
	abstract definition: WorkloadContainerDefinition;
	startedContainer?: StartedTestContainer;

	constructor(public workload: Workload) {}

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
			return (this.definition.portsToExpose ?? []).map<MappedPort>((port) => ({
				container: port,
				host: startedContainer.getMappedPort(port),
			}));
		}
	}

	/**
	 * @internal
	 */
	async containerImage() {
		return (
			this.workload.containerOverrides?.definition?.containerImage ??
			(await this.#imageFromConfiguration()) ??
			this.definition.containerImage
		);
	}

	async #imageFromConfiguration() {
		const key = camelCase(
			this.workload.constructor.name,
		) as keyof Required<Configuration>["containerImages"];
		const configuration =
			(await workloadsConfiguration()).containerImages ?? {};
		return configuration[key];
	}
	async #prepareContainer() {
		const startOptions = {
			...defaultTestStartOptions,
			...(this.workload.containerOverrides?.startOptions ?? {}),
		};
		const container = new GenericContainer(await this.containerImage());
		container.withLabels({
			[CONTAINER_LABEL_WORKLOAD_ID]: kebabCase(
				`${this.workload.constructor.name.toLowerCase()}-${this.workload.id}`,
			),
			[CONTAINER_LABEL_ORG]: "true",
		});

		container.withEnvironment(this.definition.environment);

		if (this.definition.waitStrategy) {
			container.withWaitStrategy(this.definition.waitStrategy);
		}
		if (this.definition.startupTimeout) {
			container.withStartupTimeout(this.definition.startupTimeout);
		}
		if (this.definition.healthCheck) {
			container.withHealthCheck(this.definition.healthCheck);
		}
		if (this.definition.contentsToCopy) {
			container.withCopyContentToContainer(this.definition.contentsToCopy);
		}
		for (const portToExpose of this.definition.portsToExpose ?? []) {
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
