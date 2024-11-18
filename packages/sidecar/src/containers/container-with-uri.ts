import { type StartedTestContainer } from "testcontainers";
import {
	Container,
	type SidecarContainer,
	type SidecarContainerSpec,
	type StartOptions,
} from "~sidecar/containers/container.js";
import type { StatefulWorkload } from "~sidecar/workloads/stateful/stateful-workload.js";

export abstract class ContainerWithURI
	extends Container
	implements SidecarContainer
{
	#workload: StatefulWorkload & { connectionStringEnvVar: () => string };
	/**
	 * @hideconstructor
	 */
	constructor(
		workload: StatefulWorkload & { connectionStringEnvVar: () => string },
		containerSpec: SidecarContainerSpec,
	) {
		super({
			workload,
			containerSpec,
		});
		this.#workload = workload;
	}

	override async start(options?: StartOptions) {
		const startedContainer = await super.start(
			options ?? {
				reuse: true,
			},
		);
		process.env[this.#workload.connectionStringEnvVar()] =
			this.buildConnectionURI(startedContainer);
		return startedContainer;
	}

	/**
	 * @returns The Mailer server connection string URI in the form of `smtp://username:password@host`
	 * or `undefined` if the container has not started.
	 */
	get connectionURI() {
		if (this.startedContainer) {
			return this.buildConnectionURI(this.startedContainer);
		}
	}

	abstract buildConnectionURI(container: StartedTestContainer): string;
}
