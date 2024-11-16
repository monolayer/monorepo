/**
 * @module containers
 */

import { snakeCase } from "case-anything";
import getPort from "get-port";
import { GenericContainer, type StartedTestContainer } from "testcontainers";

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
	/**
	 * ID of the associated resource.
	 */
	resourceId: string;
	/**
	 * Name to assign as a container label.
	 *
	 * Each container will start with the label `org.monolayer-sidecar.name` set to `nameLabel`.
	 *
	 * **IMPORTANT**
	 *
	 * The actual container name will be assigned by `testcontainers`.
	 */
	name: string;
	/**
	 * Container image.
	 */
	image: string;
	/**
	 * Container ports to export to the host.
	 *
	 * The published ports to the host will be assigned randomly when starting the container
	 * and they can be accessed through {@link Container.mappedPorts}
	 *
	 */
	portsToExpose?: number[];
	/**
	 * Whether to publish the exposed ports to random ports in the host
	 *
	 * @default false
	 */
	publishToRandomPorts?: boolean;
	/**
	 * Container volumnes
	 */
	persistenceVolumes?: ContainerPersistenceVolume[];
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
export const CONTAINER_LABEL_NAME = "org.monolayer-sidecar.name";
/**
 * @hidden
 */
export const CONTAINER_LABEL_RESOURCE_ID = "org.monolayer-sidecar.resource-id";
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
	/**
	 * Container name
	 *
	 * @defaultValue `options.name`(constructor)
	 */
	name: string;

	#options: ContainerOptions;

	constructor(options: ContainerOptions) {
		super(options.image);
		this.#options = options;
		this.name = snakeCase(this.#options.name);
		this.withName(this.name);
		this.withLabels({
			[CONTAINER_LABEL_NAME]: this.name,
			[CONTAINER_LABEL_RESOURCE_ID]: this.#options.resourceId,
			[CONTAINER_LABEL_ORG]: "true",
		});
	}

	/**
	 * Starts the container.
	 */
	override async start(options?: StartOptions) {
		if (this.startedContainer) {
			return this.startedContainer;
		}
		for (const portToExpose of this.#options.portsToExpose ?? []) {
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
			Array.isArray(this.#options.persistenceVolumes)
		) {
			for (const persistenceVolume of this.#options.persistenceVolumes) {
				this.withBindMounts([
					{
						mode: "rw",
						source: persistenceVolume.source,
						target: persistenceVolume.target,
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
			return (this.#options.portsToExpose ?? []).map<MappedPort>((port) => ({
				container: port,
				host: startedContainer.getMappedPort(port),
			}));
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
