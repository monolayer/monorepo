import type { Command } from "@commander-js/extra-typings";
import { snakeCase } from "case-anything";
import ora from "ora";
import { startDevContainer } from "~sidecar/containers/admin/dev-container.js";
import {
	updateDotenvFile,
	type EnvVar,
} from "~sidecar/containers/admin/update-dotenv-file.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import type { Bucket, StatefulWorkloadWithClient } from "~sidecar/workloads.js";
import { importWorkloads } from "~sidecar/workloads/import.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";

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

			for (const workload of [
				...workloads.Mailer,
				...workloads.PostgresDatabase,
				...workloads.Redis,
				...workloads.MySqlDatabase,
			]) {
				await startStatefulWorkloadWithConnectionString(workload, envVars);
			}
			await startBuckets(workloads.Bucket, envVars);
			if (envVars.length !== 0) {
				updateDotenvFile(envVars);
			}
		});
}

async function startBuckets(buckets: Bucket[], envVars: EnvVar[]) {
	if (buckets.length !== 0) {
		const spinner = ora();
		spinner.start("Start LocalStack for buckets");
		const localStackWorkload = new LocalStack("local-stack-dev");
		const localStackContainer = new LocalStackContainer(localStackWorkload);
		await localStackContainer.start();

		envVars.push({
			name: snakeCase(`WL_LOCAL_STACK_DEV_GATEWAY_URL`).toUpperCase(),
			value: localStackContainer.gatewayURL!,
		});
		spinner.succeed();
	}
	return envVars;
}

async function startStatefulWorkloadWithConnectionString(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	workload: StatefulWorkloadWithClient<any>,
	envVars: EnvVar[],
) {
	await startDevContainer(workload);
	const name = workload.connectionStringEnvVar;
	envVars.push({
		name,
		value: process.env[name]!,
	});
}
