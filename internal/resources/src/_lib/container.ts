import getPort from "get-port";
import { GenericContainer, getContainerRuntimeClient } from "testcontainers";

export interface ContainerOptions {
	name: string;
	image: { tag: string; name: string };
	portsToExpose?: number[];
	persistenceVolumes?: { source: string; target: string }[];
}

/**
 * **Not to be used directly.**
 *
 * Use constructor functions instead.
 */
export class Container extends GenericContainer {
	name: string;
	portsToExpose: number[];
	persistenceVolumes: { source: string; target: string }[];

	/**
	 * @hideconstructor
	 */
	constructor(options: ContainerOptions) {
		super(`${options.image.name}:${options.image.tag}`);
		this.name = options.name;
		this.portsToExpose = options.portsToExpose ?? [];
		this.persistenceVolumes = options.persistenceVolumes ?? [];
	}

	/**
	 * Starts the container.
	 */
	override async start() {
		await this.#exposePorts();
		this.#addLabel();
		return await super.start();
	}

	/**
	 * Starts the container with mounted volumes.
	 */
	async startWithVolumes() {
		await this.#exposePorts();
		this.#addLabel();
		this.#addPersistenceVolumes();
		this.withReuse();
		this.withEnvironment({
			REDIS_ARGS: "--save 1 1 --appendonly yes",
		});
		return await super.start();
	}

	async #exposePorts() {
		for (const portToExpose of this.portsToExpose) {
			this.withExposedPorts({
				container: portToExpose,
				host: await getPort({ port: portToExpose }),
			});
		}
	}

	#addPersistenceVolumes() {
		for (const persistenceVolume of this.persistenceVolumes) {
			this.withBindMounts([
				{
					mode: "rw",
					source: persistenceVolume.source,
					target: persistenceVolume.target,
				},
			]);
		}
	}

	#addLabel() {
		this.withLabels({
			"org.factorfour.name": this.name,
		});
	}

	/**
	 * Returns true if the container is running.
	 */
	static async isRunning(container: Container) {
		const runningContainer = await this.#fetchContainerByName(container);
		return runningContainer !== undefined;
	}

	/**
	 * Stops a container.
	 */
	static async stop(container: Container) {
		const runningContainer = await this.#fetchContainerByName(container);
		if (runningContainer) {
			await runningContainer.stop();
		}
	}

	static async #fetchContainerByName(container: Container) {
		const containerRuntimeClient = await getContainerRuntimeClient();
		return await containerRuntimeClient.container.fetchByLabel(
			"org.factorfour.name",
			container.name,
		);
	}
}
