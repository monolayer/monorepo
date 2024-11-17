import { StatefulWorkload } from "~sidecar/workloads/stateful/stateful-workload.js";

/**
 * Bucket workload
 */
export class Bucket extends StatefulWorkload {
	constructor(
		/**
		 * Bucket name.
		 */
		public name: string,
	) {
		super(name);
	}
}
