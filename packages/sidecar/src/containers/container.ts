/**
 * @module containers
 */

import { snakeCase } from "case-anything";
import getPort from "get-port";
import path from "node:path";
import { cwd } from "node:process";
import {
	GenericContainer,
	type StartedTestContainer,
	type WaitStrategy,
} from "testcontainers";
import type { Environment } from "testcontainers/build/types.js";
import { type Workload } from "~sidecar/workloads/workload.js";

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
	/**
	 * Whether to publish the exposed ports to random ports in the host
	 *
	 * @default false
	 */
	publishToRandomPorts?: boolean;
	containerSpec: SidecarContainerSpec;
}

export interface StartOptions {
	/**
	 * Whether to start the container with persistent volumes that
	 * can be reused across container sessions.
	 */
	persistenceVolumes?: boolean;
	/**
	 * Whether to reuse an already running container the same configuration
	 * and not launch a new container.
	 */
	reuse?: boolean;
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
export class Container extends GenericContainer implements SidecarContainer {
	/**
	 * The started container
	 *
	 * @defaultValue `undefined`
	 */
	startedContainer?: StartedTestContainer;

	#options: ContainerOptions;

	constructor(options: ContainerOptions) {
		super(options.containerSpec.containerImage);
		this.#options = options;
		this.withLabels({
			[CONTAINER_LABEL_WORKLOAD_ID]: this.#options.workload.id,
			[CONTAINER_LABEL_ORG]: "true",
		}).withEnvironment(options.containerSpec.environment);
		if (options.containerSpec.waitStrategy) {
			this.withWaitStrategy(options.containerSpec.waitStrategy);
		}
		if (options.containerSpec.startupTimeout) {
			this.withStartupTimeout(options.containerSpec.startupTimeout);
		}
	}

	/**
	 * Starts the container.
	 */
	override async start(options?: StartOptions) {
		if (this.startedContainer) {
			return this.startedContainer;
		}
		for (const portToExpose of this.#options.containerSpec.portsToExpose ??
			[]) {
			this.withExposedPorts({
				container: portToExpose,
				host:
					(this.#options.publishToRandomPorts ?? true)
						? await getPort({ port: portToExpose })
						: portToExpose,
			});
		}
		if (
			options?.persistenceVolumes &&
			Array.isArray(this.#options.containerSpec.persistentVolumeTargets)
		) {
			for (const persistenceVolume of this.#options.containerSpec
				.persistentVolumeTargets) {
				this.withBindMounts([
					{
						mode: "rw",
						source: path.join(
							cwd(),
							"tmp",
							"container-volumes",
							snakeCase(`${this.#options.workload.constructor.name}`),
							snakeCase(`${this.#options.workload.id}-data`),
						),
						target: persistenceVolume,
					},
				]);
			}
		}
		if (options?.reuse) {
			this.withReuse();
		}
		this.startedContainer = await super.start();
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
			return (this.#options.containerSpec.portsToExpose ?? []).map<MappedPort>(
				(port) => ({
					container: port,
					host: startedContainer.getMappedPort(port),
				}),
			);
		}
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

export interface SidecarContainer {
	/**
	 * Starts the container.
	 */
	start: (options?: StartOptions) => Promise<StartedTestContainer>;
	/**
	 * Stops the container.
	 */
	stop: () => Promise<void>;
	/**
	 * An array of exposed container ports published to the host.
	 *
	 * @returns An array of exposed container ports published to the host or `undefined` when the container has
	 * not started.
	 */
	mappedPorts?: Array<MappedPort>;
}

export interface SidecarContainerSpec {
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
	persistentVolumeTargets: string[];
}
