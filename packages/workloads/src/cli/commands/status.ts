import type { Command } from "@commander-js/extra-typings";
import Table from "cli-table3";
import {
	workloadContainerStatus,
	type WorkloadInfo,
} from "~workloads/containers/admin/introspection.js";
import { importWorkloads } from "~workloads/workloads/import.js";
import type { Database } from "~workloads/workloads/stateful/database.js";

export function status(program: Command) {
	return program
		.command("status")
		.description("List workload status")
		.action(async () => {
			const workloads = await importWorkloads();
			const statuses = await Promise.all(
				workloads.map(async (w) => workloadContainerStatus(w)),
			);
			printStatus(statuses);
		});
}

function printStatus(statuses: WorkloadInfo[]) {
	const table = new Table({
		head: ["Workload", "Type", "Status", "Ports", "Container ID"],
		style: {
			head: [],
		},
	});

	for (const status of statuses) {
		const ports = Object.entries(status.container.info?.ports ?? {}).reduce<
			string[]
		>((acc, [portAndProtocol, val]) => {
			if (Array.isArray(val)) {
				for (const hostIpAndPort of val) {
					acc.push(
						`${hostIpAndPort.HostIp}:${hostIpAndPort.HostPort}->${portAndProtocol}`,
					);
				}
			}
			return acc;
		}, []);

		const row = [
			status.workload.constructor.name === "PostgresDatabase" ||
			status.workload.constructor.name === "MySqlDatabase"
				? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					`${(status.workload as Database<any>).databaseName} (${status.workload.id})`
				: status.workload.id,
			status.workload.constructor.name,
			status.container.status,
			ports.length !== 0 ? ports.join("\n") : "N/A",
			status.container.info?.id.substring(0, 12) ?? "N/A",
		];
		table.push(row);
	}
	if (table.length !== 0) {
		console.log(table.toString());
	}
}
