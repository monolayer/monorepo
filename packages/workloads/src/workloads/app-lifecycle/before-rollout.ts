import {
	LifecycleWorkload,
	type LifecycleWorkloadOptions,
} from "~workloads/workloads/app-lifecycle/lifecycle-workload.js";

/**
 * Workload for defining scripts to run before rolling out a new application version.
 *
 * @example
 * ```ts
 * import { BeforeRollout } from "@monolayer/workloads";
 *
 * const rollout = new BeforeRollout({
 *   commands: ["db:migrate"],
 * });
 *
 * export default rollout;
 * ```
 */
export class BeforeRollout extends LifecycleWorkload {
	/**
	 * @internal
	 */
	declare _brand: "before-rollout";

	constructor(options: LifecycleWorkloadOptions) {
		super("before-rollout", options);
	}
}
