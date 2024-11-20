import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import { stopDevContainer } from "~workloads/containers/admin/dev-container.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function stop(program: Command) {
	return program
		.command("stop")
		.description("Stop local workloads")
		.requiredOption(
			"-f, --folder <workloads-folder>",
			"Path to folder with workloads",
		)
		.action(async (opts) => {
			const workloads = await importWorkloads(opts.folder);
			for (const workload of workloads) {
				const spinner = ora();
				spinner.start(spinnerMessage(workload, "Start"));
				await stopDevContainer(workload);
				spinner.succeed();
			}
		});
}
