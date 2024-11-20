import { containerStarter } from "~workloads/containers/container-starter.js";
import { defaultTestStartOptions } from "~workloads/containers/container.js";
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
) {
	workload.containerOptions({
		startOptions: defaultTestStartOptions,
	});
	containerStarter.mode = "test";
	const startedTestContainer = await containerStarter.startContainerForWorkload(
		workload,
		{
			initialize: true,
			mode: "test",
		},
	);
	if (startedTestContainer === undefined) {
		throw new Error(`no container match for workload: ${workload.id}`);
	}
}

/**
 * Launches test containers for workloads defined in a folder.
 *
 */
export async function startTestContainers(
	/**
	 * Path to folder with workloads
	 */
	folder: string,
) {
	const workloads = await importWorkloads(folder);
	for (const workload of workloads) {
		await startTestContainer(workload);
	}
}
