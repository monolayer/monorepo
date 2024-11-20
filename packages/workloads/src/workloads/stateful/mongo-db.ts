import { Database } from "~sidecar/workloads/stateful/database.js";

/**
 * MongoDb workload.
 *
 * A `MongoDb` workload is initialized with:
 * - A database name.
 * - A stable database ID that references the database server where the database is located.
 *   Multiple workloads can point to the same database server.
 * - A client constructor function providing the client of your choice.
 *   The {@link MongoDb.client | client } accessor will call this function and memoize its result.
 *
 * @example
 * ```ts
 * import { MongoDb } from "@monolayer/workloads";
 * import { MongoClient } from "mongodb";
 *
 * const producsDb = new MongoDb("products", (envVarName) =>
 *   new MongoClient(process.env[envVarName]),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class MongoDb<C> extends Database<C> {
	/**
	 * @internal
	 */
	declare _brand: "MongoDb";
	/**
	 * @internal
	 */
	get connStringComponents() {
		return ["mongodb", this.id, this.databaseName];
	}
}
