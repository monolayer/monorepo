import { kebabCase } from "case-anything";
import { getContainerRuntimeClient } from "testcontainers";
import {
	CONTAINER_LABEL_MODE,
	CONTAINER_LABEL_WORKLOAD_ID,
} from "~workloads/containers/container.js";
import type { Workload } from "~workloads/workloads/workload.js";

export async function getExistingContainer(
	workload: Workload,
	mode: "dev" | "test" = "dev",
	onlyRunning: boolean = true,
) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const containerId =
		workload.constructor.name === "Bucket"
			? "local-stack"
			: kebabCase(`${workload.constructor.name.toLowerCase()}-${workload.id}`);
	const listContainers = await containerRuntimeClient.container.list();
	const container = listContainers.find(
		(container) =>
			(onlyRunning ? container.State === "running" : true) &&
			container.Labels[CONTAINER_LABEL_WORKLOAD_ID] === containerId &&
			container.Labels[CONTAINER_LABEL_MODE] === mode,
	);
	if (container) {
		return containerRuntimeClient.container.getById(container.Id);
	}
}

export async function workloadContainerStatus(workload: Workload) {
	const existingContainer = await getExistingContainer(workload, "dev", false);

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
