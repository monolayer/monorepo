import color from "picocolors";
import type { Database } from "~sidecar/workloads/stateful/database.js";
import type { Workload } from "~sidecar/workloads/workload.js";

export function spinnerMessage(workload: Workload, prefix: "Start" | "Stop") {
	let message = "";
	if (
		workload.constructor.name === "PostgresDatabase" ||
		workload.constructor.name === "MySqlDatabase"
	) {
		const databaseWorkload = workload as Database<unknown>;
		message = `${prefix} ${databaseWorkload.databaseName} (${workload.id}) ${color.gray(workload.constructor.name)}`;
	} else {
		message = `${prefix} ${workload.id} ${color.gray(workload.constructor.name)}`;
	}
	return message;
}
