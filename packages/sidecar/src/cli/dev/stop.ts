import type { Command } from "@commander-js/extra-typings";
import { stopDevContainer } from "~sidecar/containers/admin/dev-container.js";
import { importWorkloads } from "~sidecar/workloads/import.js";

export function devStop(program: Command) {
	return program
		.command("stop")
		.description("Stop local workloads")
		.action(async () => {
			const workloads = await importWorkloads();
			for (const workload of Object.values(workloads).flatMap((w) => w)) {
				await stopDevContainer(workload);
			}
		});
}
