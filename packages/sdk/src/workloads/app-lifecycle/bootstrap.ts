import {
	LifecycleWorkload,
	type LifecycleWorkloadOptions,
} from "~workloads/workloads/app-lifecycle/lifecycle-workload.js";

/**
 * Workload for defining bootstrap an npm script to run when rolling out a fresh application.
 *
 * @example
 * ```ts
 * import { Bootstrap } from "@monolayer/sdk";
 *
 * const bootstrap = new Bootstrap("bootstrap", {
 *   scripts: "db:create",
 * });
 *
 * export default bootstrap;
 * ```
 */
export class Bootstrap extends LifecycleWorkload {
	/**
	 * @internal
	 */
	declare _brand: "bootstrap";

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
