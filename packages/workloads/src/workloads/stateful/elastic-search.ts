import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * ElasticSearch workload.
 *
 * The `ElasticSearch` workload is initialized with:
 * - `id`: A stable ID.
 * - `client`: A client constructor function providing the client of your choice.
 *   The {@link ElasticSearch.client | client } accessor will call this function and memoize its result.
 *
 * @example
 * ```ts
 * import { ElasticSearch } from "@monolayer/sidecar";
 * import { Client } from "@elastic/elasticsearch';
 *
 * const elastic = new ElasticSearch("products", (envVarName) =>
 *   new Client({
 *     node: process.env[envVarName],
 *   }),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class ElasticSearch<C> extends StatefulWorkloadWithClient<C> {
	/**
	 * @internal
	 */
	declare _brand: "ElasticSearch";
	/**
	 * @internal
	 */
	get connStringComponents() {
		return ["elastic-search", this.id];
	}
}
