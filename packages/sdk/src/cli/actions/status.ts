import type { Command } from "@commander-js/extra-typings";
import { printStatus } from "~workloads/cli/print-status.js";
import { workloadContainerStatus } from "~workloads/containers/admin/introspection.js";
import { importWorkloads } from "~workloads/scan/workload-imports.js";

export function status(program: Command) {
	const statusCommand = program
		.command("status")
		.description("status commands");

	devStatus(statusCommand);
	testStatus(statusCommand);
	return statusCommand;
}

function devStatus(program: Command) {
	return program
		.command("dev")
		.description("list the status of the workloads' Docker containers")
		.action(async () => {
			const imports = await importWorkloads();
			const statuses = await Promise.all(
				imports.workloadsWithContainers.map(async (workload) =>
					workloadContainerStatus(workload, "dev"),
				),
			);
			if (statuses.length === 0) {
				console.log("No workloads to show status.");
			} else {
				printStatus(statuses);
			}
		});
}

function testStatus(program: Command) {
	return program
		.command("test")
		.description("list the status of the workloads' Docker containers")
		.action(async () => {
			const imports = await importWorkloads();
			const statuses = await Promise.all(
				imports.workloadsWithContainers.map(async (workload) =>
					workloadContainerStatus(workload, "test"),
				),
			);
			if (statuses.length === 0) {
				console.log("No workloads to show status.");
			} else {
				printStatus(statuses);
			}
		});
}
