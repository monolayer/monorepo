import { StatefulWorkload } from "~sidecar/workloads/stateful/stateful-workload.js";

/**
 * LocalStack workload.
 *
 * @private
 */
export class LocalStack extends StatefulWorkload {
	/**
	 * @param id Unique ID.
	 */
	constructor(id: string) {
		super(id);
	}

	/**
	 * Environment variable that should hold the workload connection string.
	 */
	connectionStringEnvVar() {
		return "WL_LOCAL_STACK_GATEWAY_URL";
	}
}
