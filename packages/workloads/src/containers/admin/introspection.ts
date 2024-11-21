import { kebabCase } from "case-anything";
import { getContainerRuntimeClient } from "testcontainers";
import { CONTAINER_LABEL_WORKLOAD_ID } from "~workloads/containers/container.js";
import type { Workload } from "~workloads/workloads/workload.js";

export async function getExistingContainer(
	workload: Workload,
	onlyRunning: boolean = true,
) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	return await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_WORKLOAD_ID,
		kebabCase(`${workload.constructor.name.toLowerCase()}-${workload.id}`),
		{ status: onlyRunning ? ["running"] : undefined },
	);
}

export async function workloadContainerStatus(workload: Workload) {
	const existingContainer = await getExistingContainer(workload, false);

	const status: WorkloadInfo = {
		workload: workload,
		container: {},
	};
	if (existingContainer) {
		const inspect = await existingContainer.inspect();
		status.container.info = {
			id: inspect.Id,
			status: inspect.State.Status,
			startedAt: inspect.State.StartedAt,
			health: inspect.State.Health?.Status,
			ports: inspect.NetworkSettings.Ports,
		};
	}
	return status;
}

export interface WorkloadInfo {
	workload: Workload;
	container: {
		info?: {
			id: string;
			status: string;
			startedAt: string;
			health?: string;
			ports: {
				[portAndProtocol: string]: {
					HostIp: string;
					HostPort: string;
				}[];
			};
		};
	};
}
