import type { GenericWorkload } from "~sidecar/workloads/interfaces.js";

/**
 * Bucket workload
 */
export class Bucket implements GenericWorkload {
	constructor(public id: string) {}
}
