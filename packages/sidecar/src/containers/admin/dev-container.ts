import ora from "ora";
import color from "picocolors";
import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import { containerStarter } from "~sidecar/containers/container-starter.js";
import type { Database } from "~sidecar/workloads/stateful/database.js";
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
	const spinner = ora();
	spinner.start(spinnerMessage(workload, "Start"));
	
	const startedTestContainer = await containerStarter.startContainerForWorkload(
		workload,
		{
			initialize: false,
			mode: "dev",
		},
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
	spinner.start(spinnerMessage(workload, "Stop"));
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
function spinnerMessage(workload: Workload, prefix: "Start" | "Stop") {
	let message = "";
	if (
		workload.constructor.name === "PostgresDatabase" ||
		workload.constructor.name === "MySqlDatabase"
	) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const databaseWorkload = workload as Database<any>;
		message = `${prefix} ${databaseWorkload.databaseName} (${workload.id}) ${color.gray(workload.constructor.name)}`;
	} else {
		message = `${prefix} ${workload.id} ${color.gray(workload.constructor.name)}`;
	}
	return message;
}
