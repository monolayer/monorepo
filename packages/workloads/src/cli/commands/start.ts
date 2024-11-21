import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import { startDevContainer } from "~workloads/containers/admin/dev-container.js";
import { updateDotenvFile } from "~workloads/containers/admin/update-dotenv-file.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function start(program: Command) {
	return program
		.command("start")
		.description("Start local workloads")
		.action(async () => {
			const workloads = await importWorkloads();

			for (const workload of workloads) {
				const spinner = ora();
				spinner.start(spinnerMessage(workload, "Start"));
				try {
					await startDevContainer(workload);
				} catch (e) {
					spinner.fail();
					throw e;
				}
				spinner.succeed();
				const name = workload.connectionStringEnvVar;
				updateDotenvFile([
					{
						name: workload.connectionStringEnvVar,
						value: process.env[name]!,
					},
				]);
			}
		});
}
