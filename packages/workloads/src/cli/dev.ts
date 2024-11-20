import type { Command } from "@commander-js/extra-typings";
import { startDevContainer } from "~sidecar/containers/admin/dev-container.js";
import { type EnvVar } from "~sidecar/containers/admin/update-dotenv-file.js";
import type { StatefulWorkloadWithClient } from "~sidecar/workloads.js";
import { importWorkloads } from "~sidecar/workloads/import.js";

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
				...workloads.ElasticSearch,
			]) {
				await startStatefulWorkloadWithConnectionString(workload, envVars);
			}
		});
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
