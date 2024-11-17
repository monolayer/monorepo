import ora from "ora";
import color from "picocolors";
import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import { containerStarter } from "~sidecar/containers/container-starter.js";
import { type Workload } from "~sidecar/workloads/stateful/interfaces.js";
/**
 * Launches a dev container for a workload.
 */
export async function startDevContainer(
	/**
	 * Workload with the dev container to launch.
	 */
	workload: Workload,
) {
	const spinner = ora();
	spinner.start(
		`Start ${workload.id} ${color.gray(workload.constructor.name)}`,
	);

	const startedTestContainer = await containerStarter.startContainerForWorkload(
		workload,
		false,
	);
	if (startedTestContainer === undefined) {
		spinner.fail();
		throw new Error(`no container match for workload: ${workload.id}`);
	}
	spinner.succeed();
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
	const spinner = ora();
	spinner.start(`Stop ${workload.id} ${color.gray(workload.constructor.name)}`);
	const startedTestContainer = await getExistingContainer(workload);

	if (startedTestContainer === undefined) {
		spinner.succeed();
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
	spinner.succeed();
}
