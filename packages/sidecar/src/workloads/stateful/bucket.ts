import type { StatefulWorkload } from "~sidecar/workloads/stateful/interfaces.js";

/**
 * Bucket workload
 */
export class Bucket implements StatefulWorkload {
	stateful!: true;
	constructor(public id: string) {}
}
