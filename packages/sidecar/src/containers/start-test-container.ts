import { containerStarter } from "~sidecar/containers/container-starter.js";
import { defaultTestStartOptions } from "~sidecar/containers/container.js";
import { importWorkloads } from "~sidecar/workloads/import.js";
import { type Workload } from "~sidecar/workloads/workload.js";
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
	containerStarter.mode = "dev";
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
	for (const workload of [
		...workloads.Mailer,
		...workloads.PostgresDatabase,
		...workloads.Redis,
		...workloads.MySqlDatabase,
		...workloads.Bucket,
	]) {
		await startTestContainer(workload);
	}
}
