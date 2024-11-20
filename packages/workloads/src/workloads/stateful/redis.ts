import { StatefulWorkloadWithClient } from "~sidecar/workloads/stateful/stateful-workload.js";

/**
 * Redis workload.
 *
 *
 * @example
 * ```ts
 * import { Redis } from "@monolayer/sidecar";
 * import { createClient } from "redis";
 *
 * const redis = new Redis("redis-cache", (envVarName) =>
 *   createClient({
 *     url: process.env[envVarName],
 *   }).on("error", (err) => console.error("Redis Client Error", err)),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class Redis<C> extends StatefulWorkloadWithClient<C> {
	/**
	 * @internal
	 */
	declare _brand: "Redis";
	/**
	 * @internal
	 */
	get connStringComponents() {
		return ["redis", this.id];
	}
}
