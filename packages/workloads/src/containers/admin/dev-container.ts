import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import { containerStarter } from "~sidecar/containers/container-starter.js";
import { type Workload } from "~sidecar/workloads/workload.js";
/**
 * Launches a dev container for a workload.
 */
export async function startDevContainer(
	/**
	 * Workload with the dev container to launch.
	 */
	workload: Workload,
) {
	const startedTestContainer = await containerStarter.startContainerForWorkload(
		workload,
		{
			initialize: false,
			mode: "dev",
		},
	);
	if (startedTestContainer === undefined) {
		throw new Error(`no container match for workload: ${workload.id}`);
	}
	return startedTestContainer;
}

/**
 * Stops the dev container for a workload.
 */
export async function stopDevContainer(
	/**
	 * Workload with the dev container to stop.
	 */
	workload: Workload,
) {
	const startedTestContainer = await getExistingContainer(workload);

	if (startedTestContainer === undefined) {
		return;
	} else {
		try {
			await startedTestContainer.stop();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			if (e.reason !== "container already stopped") {
				throw e;
			}
		}
	}
}
