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
	 * @returns The connection uri for the containerized workload or
	 * `undefined` if the container has not started.
	 *
	 * *Example*: for a {@link Redis} workload the connection URI
	 * will have this format: `redis://username:password@host:port`
	 */
	get connectionURI() {
		if (this.startedContainer) {
			return this.buildConnectionURI(this.startedContainer);
		}
	}

	/**
	 * @internal
	 */
	abstract buildConnectionURI(container: StartedTestContainer): string;
}
