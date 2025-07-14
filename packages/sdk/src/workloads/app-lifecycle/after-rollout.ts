import {
	LifecycleWorkload,
	type LifecycleWorkloadOptions,
} from "~workloads/workloads/app-lifecycle/lifecycle-workload.js";

/**
 * Workload for defining an npm script to run after rolling out a new application version.
 *
 * @example
 * ```ts
 * import { AfterRollout } from "@monolayer/sdk";
 *
 * const rollout = new AfterRollout("after-rollout-1",{
 *   script: "notify",
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
