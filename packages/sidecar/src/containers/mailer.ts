import { type StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import type { WorkloadContainerOptions } from "~sidecar/containers/container.js";
import { Mailer } from "~sidecar/workloads/stateful/mailer.js";

const MAILER_SERVER_PORT = 1025;
const MAILER_WEBUI_PORT = 8025;

const mailerContainerSpec = {
	containerImage: "axllent/mailpit:v1.21.3",
	portsToExpose: [MAILER_SERVER_PORT, MAILER_WEBUI_PORT],
	environment: {},
};
/**
 * Container for Mailer
 */
export class MailerContainer<C> extends ContainerWithURI {
	/**
	 * @hideconstructor
	 */
	constructor(
		workload: Mailer<C>,
		options?: Partial<WorkloadContainerOptions>,
	) {
		super(workload, {
			...mailerContainerSpec,
			...(options ? options : {}),
		});
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

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "smtp://");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(MAILER_SERVER_PORT).toString();
		url.username = "username";
		url.password = "password";
		return url.toString();
	}
}
