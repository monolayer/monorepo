import { type GenericWorkload } from "~sidecar/workloads/interfaces.js";

/**
 * LocalStack workload.
 *
 * @private
 */
export class LocalStack implements GenericWorkload {
	readonly id: string;

	/**
	 * @param id Unique ID.
	 */
	constructor(id: string) {
		this.id = id;
	}
}
