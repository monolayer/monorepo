import { type StartedTestContainer } from "testcontainers";
import { WorkloadContainer } from "~workloads/containers/container.js";
import type { StatefulWorkload } from "~workloads/workloads/stateful/stateful-workload.js";

export abstract class ContainerWithURI extends WorkloadContainer {
	/**
	 * @hideconstructor
	 */
	constructor(workload: StatefulWorkload & { connectionStringEnvVar: string }) {
		super(workload);
	}

	override async start() {
		const startedContainer = await super.start();
		process.env[
			(
				this.workload as StatefulWorkload & {
					connectionStringEnvVar: string;
				}
			).connectionStringEnvVar
		] = this.buildConnectionURI(startedContainer);
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
