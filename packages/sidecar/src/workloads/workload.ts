import type { WorkloadContainerOptions } from "~sidecar/containers/container.js";

/**
 * @internal
 */
export interface Workload {
	/**
	 * Unique ID
	 */
	readonly id: string;

	/**
	 * @internal
	 */
	_containerOptions?: Partial<WorkloadContainerOptions> | undefined;
}
