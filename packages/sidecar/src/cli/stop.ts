import type { Command } from "@commander-js/extra-typings";
import { stopDevContainer } from "~sidecar/containers/admin/dev-container.js";
import { importWorkloads } from "~sidecar/workloads/import.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";

export function stop(program: Command) {
	return program
		.command("stop")
		.description("Stop local workloads")
		.requiredOption(
			"-f, --folder <workloads-folder>",
			"Path to folder with workloads",
		)
		.action(async (opts) => {
			const workloads = await importWorkloads(opts.folder);
			const workloadsToStop = [
				...workloads.Mailer,
				...workloads.PostgresDatabase,
				...workloads.Redis,
				...workloads.MySqlDatabase,
				...(workloads.Bucket.length !== 0
					? [new LocalStack("local-stack-dev")]
					: []),
			];
			for (const workload of workloadsToStop) {
				await stopDevContainer(workload);
			}
		});
}
