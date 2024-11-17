import { type StartedTestContainer } from "testcontainers";
import {
	Container,
	type SidecarContainer,
	type SidecarContainerSpec,
	type StartOptions,
} from "~sidecar/containers/container.js";
import { Mailer } from "~sidecar/workloads/mailer.js";

const MAILER_SERVER_PORT = 1025;
const MAILER_WEBUI_PORT = 8025;

const mailerContainerSpec = {
	containerImage: "axllent/mailpit:v1.21.3",
	portsToExpose: [MAILER_SERVER_PORT, MAILER_WEBUI_PORT],
	environment: {
		MP_DATABASE: "/data/database.db",
	},
	persistentVolumeTargets: ["/data"],
};
/**
 * Container for Mailer
 */
export class MailerContainer<C> extends Container implements SidecarContainer {
	#workload: Mailer<C>;

	/**
	 * @hideconstructor
	 */
	constructor(workload: Mailer<C>, options?: Partial<SidecarContainerSpec>) {
		super({
			workload,
			containerSpec: {
				...mailerContainerSpec,
				...(options ? options : {}),
			},
		});
		this.#workload = workload;
	}

	override async start(options?: StartOptions) {
		const startedContainer = await super.start(
			options ?? {
				persistenceVolumes: true,
				reuse: true,
			},
		);
		process.env[this.#workload.connectionStringEnvVar()] =
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
