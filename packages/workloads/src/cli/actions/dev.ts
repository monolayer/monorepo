import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { printStatus } from "~workloads/cli/print-status.js";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import {
	handleSigint,
	startWorkloads,
} from "~workloads/cli/start-workloads.js";
import { stopContainer } from "~workloads/containers/admin/container.js";
import { workloadContainerStatus } from "~workloads/containers/admin/introspection.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function dev(program: Command) {
	const devCommand = program.command("dev").description("dev commands");

	devStart(devCommand);
	devStop(devCommand);
	devStatus(devCommand);

	return devCommand;
}

function devStart(program: Command) {
	return program
		.command("start")
		.description("launch dev workloads")
		.option("-n, --no-exit", "Do not exit workflows' containers on close")
		.action(async (options) => {
			const workloads = await importWorkloads();
			startWorkloads(workloads, {
				mode: "dev",
				waitForHealthcheck: true,
			});
			if (options.exit) {
				handleSigint(workloads);
			}
		});
}

function devStop(program: Command) {
	return program
		.command("stop")
		.description("stop dev workloads")
		.action(async () => {
			const workloads = await importWorkloads();
			for (const workload of workloads) {
				const spinner = ora();
				spinner.start(spinnerMessage(workload, "Stop"));
				await stopContainer(workload, "dev");
				spinner.succeed();
			}
		});
}

function devStatus(program: Command) {
	return program
		.command("status")
		.description("list the status of the workflows' Docker containers")
		.action(async () => {
			const workloads = await importWorkloads();
			const statuses = await Promise.all(
				workloads.map(async (w) => workloadContainerStatus(w, "dev")),
			);
			printStatus(statuses);
		});
}
