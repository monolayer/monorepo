/**
 * @module containers
 */

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
	image: ContainerImage;
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
	 * Indicates whether the container should be started with persistent volumes.
	 *
	 * If true, the container will start with the persistence volumes defined in
	 * ContainerOptions that can be reused across container sessions.
	 */
	persistenceVolumes?: boolean;
	/**
	 * Determines whether to reuse an existing container instance if one is available.
	 *
	 * If true, a new container will not start if a container with the same configuration is already running will not be
	 * Useful if you want to share a container across tests without global set up.
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
	startedContainer?: StartedTestContainer;

	/**
	 * @hideconstructor
	 */
	constructor(public options: ContainerOptions) {
		super(`${options.image.name}:${options.image.tag}`);
		this.withLabels({
			[CONTAINER_LABEL_NAME]: this.options.name,
			[CONTAINER_LABEL_RESOURCE_ID]: this.options.resourceId,
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
		for (const portToExpose of this.options.portsToExpose ?? []) {
			this.withExposedPorts({
				container: portToExpose,
				host:
					(this.options.publishToRandomPorts ?? true)
						? await getPort({ port: portToExpose })
						: portToExpose,
			});
		}
		if (
			options?.persistenceVolumes &&
			Array.isArray(this.options.persistenceVolumes)
		) {
			for (const persistenceVolume of this.options.persistenceVolumes) {
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
	}

	/**
	 * Returns the mapped ports from the started container to the host.
	 *
	 */
	get mappedPorts() {
		if (this.startedContainer) {
			const startedContainer = this.startedContainer;
			return (this.options.portsToExpose ?? []).map<MappedPort>((port) => ({
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
	 * Returns an array of the container mapped ports.
	 */
	mappedPorts?: Array<MappedPort>;
}
