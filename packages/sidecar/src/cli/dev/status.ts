import type { Command } from "@commander-js/extra-typings";
import Table from "cli-table3";
import {
	workloadContainerStatus,
	type WorkloadInfo,
} from "~sidecar/containers/admin/introspection.js";
import { importWorkloads } from "~sidecar/workloads/import.js";

export function devStatus(program: Command) {
	return program
		.command("status")
		.description("List workload status")
		.action(async () => {
			const workloads = await importWorkloads();
			const statuses = await Promise.all(
				Object.values(workloads)
					.flatMap((w) => w)
					.map(async (w) => workloadContainerStatus(w)),
			);
			printStatus(statuses);
		});
}

function printStatus(statuses: WorkloadInfo[]) {
	const portsAvailable = statuses.some(
		(status) => status.container.info?.ports !== undefined,
	);

	const table = new Table({
		head: portsAvailable
			? ["Workload", "Status", "Ports"]
			: ["Workload", "Status"],
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

		table.push(
			portsAvailable
				? [status.workload.id, status.container.status, ports.join(", ")]
				: [status.workload.id, status.container.status],
		);
	}
	if (table.length !== 0) {
		console.log(table.toString());
	}
}
