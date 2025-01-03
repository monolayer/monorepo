import { type StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~workloads/containers/container.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";

/**
 * Container for Mailer
 */
export class MailerContainer<C> extends ContainerWithURI {
	/**
	 * @hideconstructor
	 */
	constructor(workload: Mailer<C>) {
		super(workload);
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "axllent/mailpit:v1.21.3",
		portsToExpose: [1025, 8025],
		environment: {},
	};

	/**
	 * @returns The Mailer web admin interface URL or `undefined`
	 * if the container has not started.
	 */
	get webURL() {
		if (this.startedContainer) {
			const url = new URL("", "http://base.com");
			url.hostname = this.startedContainer.getHost();
			url.port = this.startedContainer
				.getMappedPort(this.definition.portsToExpose[1]!)
				.toString();
			return url.toString();
		}
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "smtp://");
		url.hostname = container.getHost();
		url.port = container
			.getMappedPort(this.definition.portsToExpose[0]!)
			.toString();
		url.username = "username";
		url.password = "password";
		return url.toString();
	}
}
