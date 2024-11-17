import type { Command } from "@commander-js/extra-typings";
import Table from "cli-table3";
import {
	workloadContainerStatus,
	type WorkloadInfo,
} from "~sidecar/containers/admin/introspection.js";
import type { PostgresDatabase } from "~sidecar/workloads.js";
import { importWorkloads } from "~sidecar/workloads/import.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";

export function devStatus(program: Command) {
	return program
		.command("status")
		.description("List workload status")
		.requiredOption(
			"-f, --folder <workloads-folder>",
			"Path to folder with workloads",
		)
		.action(async (opts) => {
			const workloads = await importWorkloads(opts.folder);
			const statuses = await Promise.all(
				[
					...workloads.Mailer,
					...workloads.PostgresDatabase,
					...workloads.Redis,
					...(workloads.Bucket.length !== 0
						? [new LocalStack("local-stack-dev")]
						: []),
				].map(async (w) => workloadContainerStatus(w)),
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
			? ["Workload", "Type", "Status", "Ports"]
			: ["Workload", "Type", "Status"],
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

		const base = [
			status.workload.constructor.name === "PostgresDatabase"
				? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					`${(status.workload as PostgresDatabase<any>).databaseName} (${status.workload.id})`
				: status.workload.id,
			status.workload.constructor.name,
			status.container.status,
		];
		table.push(portsAvailable ? [...base, ports.join(", ")] : base);
	}
	if (table.length !== 0) {
		console.log(table.toString());
	}
}
