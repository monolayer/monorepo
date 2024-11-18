import { type StartedTestContainer } from "testcontainers";
import {
	WorkloadContainer,
	type StartOptions,
	type WorkloadContainerOptions,
} from "~sidecar/containers/container.js";
import type { StatefulWorkload } from "~sidecar/workloads/stateful/stateful-workload.js";

export abstract class ContainerWithURI extends WorkloadContainer {
	#workload: StatefulWorkload & { connectionStringEnvVar: () => string };
	/**
	 * @hideconstructor
	 */
	constructor(
		workload: StatefulWorkload & { connectionStringEnvVar: () => string },
		containerSpec: WorkloadContainerOptions,
	) {
		super(workload, containerSpec);
		this.#workload = workload;
	}

	override async start(options?: StartOptions) {
		const startedContainer = await super.start(
			options ?? {
				reuse: true,
				publishToRandomPorts: false,
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
