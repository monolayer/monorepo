import { containerStarter } from "~sidecar/containers/container-starter.js";
import { defaultTestStartOptions } from "~sidecar/containers/container.js";
import { type Workload } from "~sidecar/workloads/workload.js";
/**
 * Launches a test container for a workload.
 *
 * @group Testing
 * @category Containers
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
	return startedTestContainer;
}
