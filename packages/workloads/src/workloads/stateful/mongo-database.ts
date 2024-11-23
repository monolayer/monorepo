import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * MongoDB database workload.
 *
 * A `MongoDatabase` workload is initialized with:
 * - A database name.
 * - A stable database ID that references the database server where the database is located.
 *   Multiple workloads can point to the same database server.
 * - A client constructor function providing the client of your choice.
 *   The {@link MongoDatabase.client | client } accessor will call this function and memoize its result.
 *
 * @example
 * ```ts
 * import { MongoDatabase } from "@monolayer/workloads";
 * import { MongoClient } from "mongodb";
 *
 * const producsDb = new MongoDatabase("products", (envVarName) =>
 *   new MongoClient(process.env[envVarName]),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class MongoDatabase<C> extends Database<C> {
	/**
	 * @internal
	 */
	declare _brand: "MongoDatabase";

	/**
	 * @internal
	 */
	connStringPrefix(): string {
		return "mongodb";
	}
}
