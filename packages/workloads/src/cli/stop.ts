import type { Command } from "@commander-js/extra-typings";
import { stopDevContainer } from "~sidecar/containers/admin/dev-container.js";
import { importWorkloads } from "~sidecar/workloads/import.js";

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
				...workloads.ElasticSearch,
				...workloads.MongoDb,
			];
			for (const workload of workloadsToStop) {
				await stopDevContainer(workload);
			}
		});
}
