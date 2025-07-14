import ora from "ora";
import { spinnerMessage } from "~workloads/cli/spinner-message.js";
import {
	startContainer,
	stopContainer,
} from "~workloads/containers/admin/container.js";
import { updateDotenvFile } from "~workloads/containers/admin/update-dotenv-file.js";
import type {
	StatefulWorkload,
	StatefulWorkloadWithClient,
} from "~workloads/workloads/stateful/stateful-workload.js";
import type { AnyBroadcast } from "~workloads/workloads/stateless/broadcast/router.js";

export async function startWorkloads(
	workloads: (
		| StatefulWorkloadWithClient
		| (StatefulWorkload & { connectionStringEnvVar: string })
		| AnyBroadcast
	)[],
	options: {
		mode: "dev" | "test";
		waitForHealthcheck: boolean;
	},
) {
	for (const workload of workloads) {
		const spinner = ora();
		spinner.start(spinnerMessage(workload, "Start"));
		try {
			await startContainer(workload, options);
			const name = workload.connectionStringEnvVar;
			await updateDotenvFile(
				[
					{
						name: workload.connectionStringEnvVar,
						value: process.env[name]!,
					},
				],
				options.mode,
			);
		} catch (e) {
			spinner.fail();
			throw e;
		}
		spinner.succeed();
	}
}

async function stopWorkloads(workloads: StatefulWorkloadWithClient[]) {
	await Promise.all(
		workloads.map(async (workload) => await stopContainer(workload, "dev")),
	);
}

export function handleSigint(workloads: StatefulWorkloadWithClient[]) {
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
