import { type StatefulWorkload } from "~sidecar/workloads/stateful/interfaces.js";

/**
 * LocalStack workload.
 *
 * @private
 */
export class LocalStack implements StatefulWorkload {
	stateful!: true;
	readonly id: string;

	/**
	 * @param id Unique ID.
	 */
	constructor(id: string) {
		this.id = id;
	}
}
