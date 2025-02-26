import {
	LifecycleWorkload,
	type LifecycleWorkloadOptions,
} from "~workloads/workloads/app-lifecycle/lifecycle-workload.js";

/**
 * Workload for defining scripts to run after rolling out a new application version.
 *
 * @example
 * ```ts
 * import { AfterRollout } from "@monolayer/workloads";
 *
 * const rollout = new AfterRollout({
 *   commands: ["db:migrate"],
 * });
 *
 * export rollout;
 * ```
 */
export class AfterRollout extends LifecycleWorkload {
	/**
	 * @internal
	 */
	declare _brand: "after-rollout";

	constructor(
		/**
		 * Unique ID
		 */
		id: string,
		options: LifecycleWorkloadOptions,
	) {
		super(id, options);
	}
}
