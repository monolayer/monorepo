import { kebabCase } from "case-anything";
import { cwd } from "node:process";
import path from "path";
import type { StartedTestContainer } from "testcontainers";
import {
	Container,
	type SidecarContainer,
	type StartOptions,
} from "~sidecar/containers/container.js";
import { randomName } from "~sidecar/containers/random-name.js";
import { Mailer } from "~sidecar/resources/mailer.js";

const MAILER_SERVER_PORT = 1025;
const MAILER_WEBUI_PORT = 8025;

/**
 * Container for Mailer
 */
export class MailerContainer<C> extends Container implements SidecarContainer {
	#resource: Mailer<C>;

	/**
	 * @hideconstructor
	 */
	constructor(resource: Mailer<C>) {
		const name = randomName();
		super({
			resourceId: resource.id,
			name,
			image: Mailer.containerImage,
			portsToExpose: [MAILER_SERVER_PORT, MAILER_WEBUI_PORT],
			persistenceVolumes: [
				{
					source: path.join(
						cwd(),
						"tmp",
						"container-volumes",
						kebabCase(`${name}-data`),
					),
					target: "/data",
				},
			],
		});
		this.withEnvironment({
			MP_DATABASE: "/data/database.db",
		});
		this.#resource = resource;
	}

	override async start(options?: StartOptions) {
		const startedContainer = await super.start(
			options ?? {
				persistenceVolumes: true,
				reuse: true,
			},
		);
		process.env[this.#resource.connectionStringEnvVar()] =
			this.#buildConnectionURI(startedContainer);
		return startedContainer;
	}

	/**
	 * @returns The Mailer server connection string URI in the form of `smtp://username:password@host`
	 * or `undefined` if the container has not started.
	 */
	get connectionURI() {
		if (this.startedContainer) {
			return this.#buildConnectionURI(this.startedContainer);
		}
	}

	/**
	 * @returns The Mailer web admin interface URL or `undefined`
	 * if the container has not started.
	 */
	get webURL() {
		if (this.startedContainer) {
			const url = new URL("", "http://base.com");
			url.hostname = this.startedContainer.getHost();
			url.port = this.startedContainer
				.getMappedPort(MAILER_WEBUI_PORT)
				.toString();
			return url.toString();
		}
	}

	#buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "smtp://");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(MAILER_SERVER_PORT).toString();
		url.username = "username";
		url.password = "password";
		return url.toString();
	}
}
