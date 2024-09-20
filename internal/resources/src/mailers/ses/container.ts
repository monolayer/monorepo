import path from "node:path";
import { fileURLToPath } from "node:url";
import { GenericContainer } from "testcontainers";

import { snakeCase } from "case-anything";
import { Container } from "~resources/_lib/container.js";
import { StartedServerContainerWithWebUI } from "~resources/_lib/started-container.js";
import { updateEnvVar } from "~resources/write-env.js";

const SES_SERVER_PORT = 8005;

export interface SESContainerOptions {
	resourceId: string;
	connectionStringEnvVarName: string;
}

export class SESContainer extends Container {
	#connectionStringEnvVarName: string;

	constructor(options: SESContainerOptions) {
		const name = snakeCase(`ses_${options.resourceId}`);
		const image = {
			name: "aws-ses-local",
			tag: "latest",
		};
		const portsToExpose = [SES_SERVER_PORT];
		super({ name, image, portsToExpose, persistenceVolumes: [] });

		this.#connectionStringEnvVarName = options.connectionStringEnvVarName;
	}

	override async start(): Promise<StartedSESContainer> {
		await buildSESLocalContainer();
		const container = new StartedSESContainer(await super.start());
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	async startPersisted(): Promise<StartedSESContainer> {
		await buildSESLocalContainer();
		const container = new StartedSESContainer(await super.startWithVolumes());
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	async #addConnectionStringToEnvironment(container: StartedSESContainer) {
		await updateEnvVar("SES_MAILER_URL", container.connectionURL);
		process.env["SES_MAILER_URL"] = container.connectionURL;
		if (this.#connectionStringEnvVarName) {
			await updateEnvVar(
				this.#connectionStringEnvVarName,
				container.connectionURL,
			);
		}
	}
}

export class StartedSESContainer extends StartedServerContainerWithWebUI<StartedSESContainer> {
	get serverPort() {
		return this.getMappedPort(SES_SERVER_PORT);
	}

	get webUIPort() {
		return this.serverPort;
	}

	get connectionURL() {
		const url = new URL("", "http://base.com");
		url.hostname = this.getHost();
		url.port = this.serverPort.toString();
		return url.toString();
	}

	get webURL() {
		return this.connectionURL;
	}
}

async function buildSESLocalContainer() {
	return await GenericContainer.fromDockerfile(
		path.dirname(fileURLToPath(import.meta.url)),
	).build("aws-ses-local:latest", { deleteOnExit: false });
}
