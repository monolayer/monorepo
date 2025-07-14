import { Workload } from "~workloads/workloads/workload.js";

export interface LifecycleWorkloadOptions {
	/**
	 * Array of script names defined in `package.json`.
	 */
	script: string;
}

export abstract class LifecycleWorkload extends Workload {
	declare script: LifecycleWorkloadOptions["script"];

	constructor(id: string, options: LifecycleWorkloadOptions) {
		super(id);
		this.script = options.script;
	}
}
