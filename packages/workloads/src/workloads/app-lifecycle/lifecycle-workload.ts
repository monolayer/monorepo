import { Workload } from "~workloads/workloads/workload.js";

export interface LifecycleWorkloadOptions {
	/**
	 * Array of script names defined in `package.json`.
	 */
	commands: string[];
}

export abstract class LifecycleWorkload extends Workload {
	declare commands: LifecycleWorkloadOptions["commands"];

	constructor(id: string, options: LifecycleWorkloadOptions) {
		super(id);
		this.commands = options.commands;
	}
}
