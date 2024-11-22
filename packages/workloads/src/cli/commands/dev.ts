import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import {
	startDevContainer,
	stopDevContainer,
} from "~workloads/containers/admin/dev-container.js";
import { updateDotenvFile } from "~workloads/containers/admin/update-dotenv-file.js";
import { importWorkloads } from "~workloads/workloads/import.js";
import type { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

export function dev(program: Command) {
	return program
		.command("dev")
		.description("Launch workflows")
		.option("-n, --no-exit", "Do not exit workflows' containers on close")
		.action(async (options) => {
			const workloads = await importWorkloads();
			startWorkloads(workloads);
			if (options.exit) {
				handleSigint(workloads);
			}
		});
}

async function startWorkloads(
	workloads: StatefulWorkloadWithClient<unknown>[],
) {
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
}

async function stopWorkloads(workloads: StatefulWorkloadWithClient<unknown>[]) {
	await Promise.all(
		workloads.map(async (workload) => await stopDevContainer(workload)),
	);
}

function handleSigint(workloads: StatefulWorkloadWithClient<unknown>[]) {
	setInterval(() => {}, 10000);
	let sigint = false;
	process.on("SIGINT", async () => {
		if (sigint === false) {
			sigint = true;
			console.log("");
			console.log("Stopping workloads...");
			await stopWorkloads(workloads);
			process.exit(0);
		}
	});
}
