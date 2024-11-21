import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import { startDevContainer } from "~workloads/containers/admin/dev-container.js";
import {
	updateDotenvFile,
	type EnvVar,
} from "~workloads/containers/admin/update-dotenv-file.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function dev(program: Command) {
	return program
		.command("dev")
		.description("Start local workloads")
		.requiredOption(
			"-f, --folder <workloads-folder>",
			"Path to folder with workloads",
		)
		.action(async (opts) => {
			const workloads = await importWorkloads(opts.folder);
			const envVars: EnvVar[] = [];

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
				envVars.push({
					name,
					value: process.env[name]!,
				});
			}
			if (envVars.length !== 0) {
				updateDotenvFile(envVars);
			}
		});
}
