/**
 * @module containers
 */

import { camelCase, kebabCase } from "case-anything";
import getPort from "get-port";
import {
	GenericContainer,
	Wait,
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
	/**
	 *
	 */
	mode: "dev" | "test";
}

/**
 * @hidden
 */
export const CONTAINER_LABEL_WORKLOAD_ID =
	"org.monolayer-workloads.workload-id";
/**
 * @hidden
 */
export const CONTAINER_LABEL_ORG = "org.monolayer-workloads";

/**
 * @hidden
 */
export const CONTAINER_LABEL_MODE = "org.monolayer-workloads.mode";

/**
 * @internal
 */
export abstract class WorkloadContainer {
	abstract definition: WorkloadContainerDefinition;
	startedContainer?: StartedTestContainer;

	mode: "dev" | "test" = "dev";

	constructor(public workload: Workload) {}

	/**
	 * Starts the container.
	 */
	async start(waithForHealthcheck: boolean = false) {
		const container = await this.#prepareContainer(waithForHealthcheck);
		this.startedContainer = await container.start();
		await this.afterStart();
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
			(await this.#imageFromConfiguration()) ?? this.definition.containerImage
		);
	}

	async afterStart() {
		return;
	}

	async #imageFromConfiguration() {
		const name =
			this.workload.constructor.name === "Bucket"
				? "localStack"
				: this.workload.constructor.name;
		const key = camelCase(
			name,
		) as keyof Required<Configuration>["containerImages"];
		const configuration =
			(await workloadsConfiguration()).containerImages ?? {};
		return configuration[key];
	}
	async #prepareContainer(waithForHealthcheck: boolean = false) {
		const container = new GenericContainer(await this.containerImage());
		container.withLabels(this.containerLabels());

		container.withEnvironment(this.definition.environment);

		container.withWaitStrategy(
			waithForHealthcheck && this.definition.waitStrategy
				? this.definition.waitStrategy
				: Wait.forLogMessage(""),
		);

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
					this.mode === "test"
						? await getPort({ port: portToExpose + 1 })
						: portToExpose,
			});
		}
		container.withReuse();
		return container;
	}

	containerLabels() {
		return {
			[CONTAINER_LABEL_WORKLOAD_ID]: this.qualifiedWorkloadId(),
			[CONTAINER_LABEL_ORG]: "true",
			[CONTAINER_LABEL_MODE]: this.mode,
		};
	}

	qualifiedWorkloadId() {
		return kebabCase(
			`${this.workload.constructor.name.toLowerCase()}-${this.workload.id}`,
		);
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
