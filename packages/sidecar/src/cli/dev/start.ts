import type { Command } from "@commander-js/extra-typings";
import { startDevContainer } from "~sidecar/containers/admin/dev-container.js";
import { importWorkloads } from "~sidecar/workloads/import.js";

export function devStart(program: Command) {
	return program
		.command("start")
		.description("Start local workloads")
		.action(async () => {
			const workloads = await importWorkloads();
			for (const workload of Object.values(workloads).flatMap((w) => w)) {
				await startDevContainer(workload);
			}
		});
}
