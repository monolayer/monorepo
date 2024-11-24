import type { Command } from "@commander-js/extra-typings";
import { printStatus } from "~workloads/cli/print-status.js";
import { workloadContainerStatus } from "~workloads/containers/admin/introspection.js";
import { importWorkloads } from "~workloads/workloads/import.js";

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
			const workloads = await importWorkloads();
			const statuses = await Promise.all(
				workloads.map(async (w) => workloadContainerStatus(w, "dev")),
			);
			printStatus(statuses);
		});
}

function testStatus(program: Command) {
	return program
		.command("test")
		.description("list the status of the workloads' Docker containers")
		.action(async () => {
			const workloads = await importWorkloads();
			const statuses = await Promise.all(
				workloads.map(async (w) => workloadContainerStatus(w, "test")),
			);
			printStatus(statuses);
		});
}
