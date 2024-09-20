import path from "node:path";
import { GenericContainer } from "testcontainers";

import { snakeCase } from "case-anything";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";
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
	const buildDir = path.join(cwd(), "tmp", "aws-ses-local");
	mkdirSync(buildDir, { recursive: true });
	writeFileSync(path.join(buildDir, "Dockerfile"), SESLocalDockerFile);
	const container = await GenericContainer.fromDockerfile(buildDir).build(
		"aws-ses-local:latest",
		{ deleteOnExit: false },
	);
	unlinkSync(buildDir);
	return container;
}

const SESLocalDockerFile = `FROM node:alpine AS builder

RUN apk add git && \
    git clone --depth=1 https://github.com/domdomegg/aws-ses-v2-local.git /srv/www

WORKDIR /srv/www

RUN npm install && npm run prepublishOnly

# Create the image.
FROM node:alpine

COPY --from=builder /srv/www/branding /srv/www/branding/
COPY --from=builder /srv/www/dist /srv/www/dist/
COPY --from=builder /srv/www/node_modules /srv/www/node_modules/
COPY --from=builder /srv/www/static /srv/www/static/
COPY --from=builder /srv/www/package.json /srv/www/package.json
COPY --from=builder /srv/www/package-lock.json /srv/www/package-lock.json

WORKDIR /srv/www/dist

ENTRYPOINT ["node", "cli.js", "--host", "0.0.0.0", "--port", "8005"]
`;
