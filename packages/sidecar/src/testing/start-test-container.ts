import { containerStarter } from "~sidecar/containers/container-starter.js";
import { type Workload } from "~sidecar/workloads/workload.js";
/**
 * Launches a test container for a workload.
 */
export async function startTestContainer(
	/**
	 * Workload to launch a test container.
	 */
	workload: Workload,
) {
	const startedTestContainer = await containerStarter.startContainerForWorkload(
		workload,
		{
			startOptions: {
				reuse: false,
				publishToRandomPorts: true,
			},
			initialize: true,
		},
	);
	if (startedTestContainer === undefined) {
		throw new Error(`no container match for workload: ${workload.id}`);
	}
	return startedTestContainer;
}
