import type { Command } from "@commander-js/extra-typings";
import {
	handleSigint,
	startWorkloads,
} from "~workloads/cli/start-workloads.js";
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
		.option("-n, --no-exit", "Do not exit workloads' containers on close")
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

function testStart(program: Command) {
	return program
		.command("test")
		.description("launch test workloads")
		.action(async () => {
			const workloads = await importWorkloads();
			startWorkloads(workloads, {
				mode: "test",
				waitForHealthcheck: true,
			});
		});
}
