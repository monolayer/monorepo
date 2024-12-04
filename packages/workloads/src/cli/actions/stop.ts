import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { importWorkloads } from "~workloads/beamer/scan/workload-imports.js";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import { stopContainer } from "~workloads/containers/admin/container.js";

export function stop(program: Command) {
	const stopCommand = program.command("stop").description("stop commands");

	devStop(stopCommand);
	testStop(stopCommand);

	return stopCommand;
}

function devStop(program: Command) {
	return program
		.command("dev")
		.description("stop dev workloads")
		.action(async () => {
			const imports = await importWorkloads();
			for (const workload of imports.workloadsWithContainers) {
				const spinner = ora();
				spinner.start(spinnerMessage(workload, "Stop"));
				await stopContainer(workload, "dev");
				spinner.succeed();
			}
		});
}

function testStop(program: Command) {
	return program
		.command("test")
		.description("stop test workloads")
		.action(async () => {
			const imports = await importWorkloads();
			for (const workload of imports.workloadsWithContainers) {
				const spinner = ora();
				spinner.start(spinnerMessage(workload, "Stop"));
				await stopContainer(workload, "test");
				spinner.succeed();
			}
		});
}
