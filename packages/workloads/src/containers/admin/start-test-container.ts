import { containerStarter } from "~workloads/containers/container-starter.js";
import { importWorkloads } from "~workloads/workloads/import.js";
import { type Workload } from "~workloads/workloads/workload.js";
/**
 * Launches a test container for a workload.
 *
 */
export async function startTestContainer(
	/**
	 * Workload to launch a test container.
	 */
	workload: Workload,
	waitForHealthcheck: boolean = false,
) {
	const startedTestContainer = await containerStarter.startForWorload(
		workload,
		{ mode: "test", waitForHealthcheck },
	);
	if (startedTestContainer === undefined) {
		throw new Error(`no container match for workload: ${workload.id}`);
	}
	return startedTestContainer;
}

/**
 * Launches test containers for workloads.
 *
 */
export async function startTestContainers() {
	const workloads = await importWorkloads();
	for (const workload of workloads) {
		await startTestContainer(workload);
	}
}
