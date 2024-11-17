import { snakeCase } from "case-anything";
import {
	type StatefulWorkload,
	type WorkloadClient,
} from "~sidecar/workloads/stateful/interfaces.js";

/**
 * Redis workload.
 *
 * @example
 * ```ts
 * import { Redis } from "@monolayer/sidecar";
 * import { createClient } from "redis";
 *
 * const redis = new Redis("redis-cache", (connectionStringEnvVar) =>
 *   createClient({
 *     url: process.env[connectionStringEnvVar],
 *   }).on("error", (err) => console.error("Redis Client Error", err)),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class Redis<C> implements StatefulWorkload, WorkloadClient<C> {
	stateful!: true;
	readonly id: string;

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
		/**
		 * Client constructor function. Executed once when accessing the {@link Redis.client }
		 */
		client: (connectionStringVar: string) => C,
	) {
		this.id = id;
		this.#clientConstructor = client;
	}

	#client?: C | never;
	#clientConstructor: (connectionStringVar: string) => C;

	/**
	 * Return the client by calling the client constructor function.
	 *
	 * The client is memoized.
	 */
	get client(): C {
		if (this.#client) {
			return this.#client;
		}
		this.#client = this.#clientConstructor(this.connectionStringEnvVar());
		return this.#client;
	}

	/**
	 * Environment variable that should holds the workload connection string.
	 *
	 * Format: `WL_${workloadName}_${kebabCase(workloadId)}_URL`.toUpperCase()
	 * @example
	 *
	 * const cache = new Redis("app-cache", (connectionStringEnvVar) =>
	 *   createClient({
	 *     // connectionStringEnvVar: WL_REDIS_APP_CACHE_URL
	 *     url: process.env[connectionStringEnvVar],
	 *   }).on("error", (err) => console.error("Redis Client Error", err)),
	 * );
	 */
	connectionStringEnvVar() {
		return snakeCase(
			`WL_${this.constructor.name}_${this.id}_url`,
		).toUpperCase();
	}
}
