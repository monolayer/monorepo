import { kebabCase, snakeCase } from "case-anything";
import path from "path";
import { Container } from "~resources/_lib/container.js";
import { StartedServerContainerWithWebUI } from "~resources/_lib/started-container.js";
import { updateEnvVar } from "~resources/write-env.js";

const REDIS_IMAGE_NAME = "redis/redis-stack";
const REDIS_IMAGE_TAG = "latest";
const REDIS_SERVER_PORT = 6379;
const REDIS_WEB_UI_PORT = 8001;

export interface RedisContainerOptions {
	resourceId: string;
	imageTag?: string;
	connectionStringEnvVarName?: string;
}

export class RedisContainer extends Container {
	#connectionStringEnvVarName?: string;

	constructor(options: RedisContainerOptions) {
		const name = snakeCase(`redis_${options.resourceId}`);
		const image = {
			name: REDIS_IMAGE_NAME,
			tag: options.imageTag ?? REDIS_IMAGE_TAG,
		};
		const portsToExpose = [REDIS_SERVER_PORT, REDIS_WEB_UI_PORT];
		const persistenceVolumes = [
			{
				source: path.join("/tmp", kebabCase(`${options.resourceId}-data`)),
				target: "/data",
			},
		];
		super({ name, image, portsToExpose, persistenceVolumes });

		if (options.connectionStringEnvVarName) {
			this.#connectionStringEnvVarName = options.connectionStringEnvVarName;
		}
	}

	override async start(): Promise<StartedRedisContainer> {
		const container = new StartedRedisContainer(await super.start());
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	async startPersisted(): Promise<StartedRedisContainer> {
		const container = new StartedRedisContainer(await super.startWithVolumes());
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	async #addConnectionStringToEnvironment(container: StartedRedisContainer) {
		if (this.#connectionStringEnvVarName) {
			await updateEnvVar(
				this.#connectionStringEnvVarName,
				container.connectionURL,
			);
			process.env[this.#connectionStringEnvVarName] = container.connectionURL;
		}
	}
}

export class StartedRedisContainer extends StartedServerContainerWithWebUI<StartedRedisContainer> {
	get serverPort() {
		return this.getMappedPort(REDIS_SERVER_PORT);
	}

	get webUIPort() {
		return this.getMappedPort(REDIS_WEB_UI_PORT);
	}

	get connectionURL() {
		const url = new URL("", "redis://");
		url.hostname = this.getHost();
		url.port = this.serverPort.toString();
		return url.toString();
	}

	get webURL() {
		const url = new URL("", "http://base.com");
		url.hostname = this.getHost();
		url.port = this.webUIPort.toString();
		return url.toString();
	}
}
