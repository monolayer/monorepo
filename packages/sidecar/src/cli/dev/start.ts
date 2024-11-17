import type { Command } from "@commander-js/extra-typings";
import { snakeCase } from "case-anything";
import ora from "ora";
import { startDevContainer } from "~sidecar/containers/admin/dev-container.js";
import { type EnvVar } from "~sidecar/containers/admin/update-dotenv-file.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import type { Bucket, PostgresDatabase, Redis } from "~sidecar/workloads.js";
import { importWorkloads } from "~sidecar/workloads/import.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";

export function devStart(program: Command) {
	return program
		.command("start")
		.description("Start local workloads")
		.action(async () => {
			const workloads = await importWorkloads();
			const envVars: EnvVar[] = [];

			await startMailers(workloads.Mailer, envVars);
			await startPostgresDatabases(workloads.PostgresDatabase, envVars);
			await startRedis(workloads.Redis, envVars);
			await startBuckets(workloads.Bucket, envVars);
		});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function startMailers(mailers: Mailer<any>[], envVars: EnvVar[]) {
	for (const mailer of mailers) {
		await startDevContainer(mailer);
		const name = mailer.connectionStringEnvVar();
		envVars.push({
			name,
			value: process.env[name]!,
		});
	}
}

async function startPostgresDatabases(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	postgresDatabases: PostgresDatabase<any>[],
	envVars: EnvVar[],
) {
	for (const postgresDatabase of postgresDatabases) {
		await startDevContainer(postgresDatabase);
		const name = postgresDatabase.connectionStringEnvVar();
		envVars.push({
			name,
			value: process.env[name]!,
		});
	}
}

async function startRedis(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	redis: Redis<any>[],
	envVars: EnvVar[],
) {
	for (const red of redis) {
		await startDevContainer(red);
		const name = red.connectionStringEnvVar();
		envVars.push({
			name,
			value: process.env[name]!,
		});
	}
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
