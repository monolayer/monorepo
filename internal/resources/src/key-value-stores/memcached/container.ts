import { snakeCase } from "case-anything";
import { Container } from "~resources/_lib/container.js";
import { StartedServerContainer } from "~resources/_lib/started-container.js";
import { updateEnvVar } from "~resources/write-env.js";

const MEMCACHED_IMAGE_NAME = "memcached";
const MEMCACHED_IMAGE_TAG = "alpine";
const MEMCACHED_SERVER_PORT = 11211;

export interface MemcachedContainerOptions {
	resourceId: string;
	imageTag?: string;
	connectionStringEnvVarName?: string;
}

export class MemcachedContainer extends Container {
	#connectionStringEnvVarName?: string;

	constructor(options: MemcachedContainerOptions) {
		const name = snakeCase(`smtp_${options.resourceId}`);
		const image = {
			name: MEMCACHED_IMAGE_NAME,
			tag: options.imageTag ?? MEMCACHED_IMAGE_TAG,
		};
		const portsToExpose = [MEMCACHED_SERVER_PORT];
		super({ name, image, portsToExpose, persistenceVolumes: [] });

		if (options.connectionStringEnvVarName) {
			this.#connectionStringEnvVarName = options.connectionStringEnvVarName;
		}
	}

	override async start(): Promise<StartedMemcachedContainer> {
		const container = new StartedMemcachedContainer(await super.start());
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	async startPersisted(): Promise<StartedMemcachedContainer> {
		const container = new StartedMemcachedContainer(
			await super.startWithVolumes(),
		);
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	async #addConnectionStringToEnvironment(
		container: StartedMemcachedContainer,
	) {
		if (this.#connectionStringEnvVarName) {
			await updateEnvVar(
				this.#connectionStringEnvVarName,
				container.connectionURL,
			);
			process.env[this.#connectionStringEnvVarName] = container.connectionURL;
		}
	}
}

export class StartedMemcachedContainer extends StartedServerContainer<StartedMemcachedContainer> {
	get serverPort() {
		return this.getMappedPort(MEMCACHED_SERVER_PORT);
	}

	get connectionURL() {
		return `${this.getHost()}:${this.serverPort}`;
	}
}
