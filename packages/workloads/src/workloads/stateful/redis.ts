import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for Redis API compatible servers.
 *
 * The `Redis` workload is initialized with:
 * - A stable ID.
 * - A client constructor function providing the client of your choice.
 *   The {@link Redis.client | client } accessor will call this function and memoize its result.
 *   The expected envirnoment variable name with the connection string is passed as an argument.
 *
 * **NOTES**
 *
 * When launching the development or test containers with `npx workloads start dev`, the environment
 * variable with the connection string for the workload's Docker container
 * will be written to the corresponding dotenv file (`.env` or `.env.test`)
 *
 * @example
 * ```ts
 * import { Redis } from "@monolayer/workloads";
 * import { Redis as IORedis } from "ioredis";
 *
 * const cache = new Redis("cache", (envVarName) =>
 *   new IORedis(process.env[envVarName]!)
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class Redis extends StatefulWorkloadWithClient {
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
