import { containerStarter } from "~sidecar/containers/container-starter.js";
import { type GenericWorkload } from "~sidecar/workloads/interfaces.js";

/**
 * Launches a test container for a workload.
 */
export async function startTestContainer(
	/**
	 * Workload to launch a test container.
	 */
	workload: GenericWorkload,
) {
	const startedTestContainer =
		await containerStarter.startContainerForWorkload(workload);
	if (startedTestContainer === undefined) {
		throw new Error(`no container match for workload: ${workload.id}`);
	}
	return startedTestContainer;
}
