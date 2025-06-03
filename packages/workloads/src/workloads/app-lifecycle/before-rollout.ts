import {
	LifecycleWorkload,
	type LifecycleWorkloadOptions,
} from "~workloads/workloads/app-lifecycle/lifecycle-workload.js";

/**
 * Workload for defining an npm script to run before rolling out a new application version.
 *
 * @example
 * ```ts
 * import { BeforeRollout } from "@monolayer/workloads";
 *
 * const rollout = new BeforeRollout("before-1", {
 *   scripts: "db:migrate",
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
