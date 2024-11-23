import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { printStatus } from "~workloads/cli/print-status.js";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import { startWorkloads } from "~workloads/cli/start-workloads.js";
import { stopContainer } from "~workloads/containers/admin/container.js";
import { workloadContainerStatus } from "~workloads/containers/admin/introspection.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function test(program: Command) {
	const testCommand = program.command("test").description("test commands");

	testStart(testCommand);
	testStop(testCommand);
	testStatus(testCommand);

	return testCommand;
}

export function testStart(program: Command) {
	return program
		.command("start")
		.description("launch test workloads")
		.action(async () => {
			const workloads = await importWorkloads();
			startWorkloads(workloads, {
				mode: "test",
				waitForHealthcheck: true,
			});
		});
}

function testStop(program: Command) {
	return program
		.command("stop")
		.description("stop test workloads")
		.action(async () => {
			const workloads = await importWorkloads();
			for (const workload of workloads) {
				const spinner = ora();
				spinner.start(spinnerMessage(workload, "Stop"));
				await stopContainer(workload, "test");
				spinner.succeed();
			}
		});
}

function testStatus(program: Command) {
	return program
		.command("status")
		.description("list the status of the workflows' Docker containers")
		.action(async () => {
			const workloads = await importWorkloads();
			const statuses = await Promise.all(
				workloads.map(async (w) => workloadContainerStatus(w, "test")),
			);
			printStatus(statuses);
		});
}
