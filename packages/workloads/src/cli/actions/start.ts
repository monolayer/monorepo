import type { Command } from "@commander-js/extra-typings";
import { startWorkloads } from "~workloads/cli/start-workloads.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function start(program: Command) {
	const startCommand = program.command("start").description("start commands");

	devStart(startCommand);
	testStart(startCommand);

	return startCommand;
}

function devStart(program: Command) {
	return program
		.command("dev")
		.description("launch dev workloads")
		.action(async () => {
			const imports = await importWorkloads();
			startWorkloads(imports.allWorkloads, {
				mode: "dev",
				waitForHealthcheck: true,
			});
		});
}

function testStart(program: Command) {
	return program
		.command("test")
		.description("launch test workloads")
		.action(async () => {
			const imports = await importWorkloads();
			startWorkloads(imports.allWorkloads, {
				mode: "test",
				waitForHealthcheck: true,
			});
		});
}
