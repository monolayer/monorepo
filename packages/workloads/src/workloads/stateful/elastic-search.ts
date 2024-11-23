import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for ElasticSearch engines.
 *
 * The `ElasticSearch` workload is initialized with:
 * - `id`: A stable ID.
 * - `client`: A client constructor function providing the client of your choice.
 *   The {@link ElasticSearch.client | client } accessor will call this function and memoize its result.
 *   The expected envirnoment variable name with the connection string is passed as an argument.
 *
 * **NOTES**
 *
 * When launching the development or test containers with `npx workloads start`, the environment
 * variable will be written to the corresponding dotenv file (`.env` or `.env.test`)
 *
 * * @example
 * ```ts
 * import { ElasticSearch } from "@monolayer/workloads";
 * import { Client } from "@elastic/elasticsearch';
 *
 * const elastic = new ElasticSearch("products", (envVarName) =>
 *   new Client({
 *     // envVarName = MONO_ELASTIC_SEARCH_PRODUCTS_URL
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
