import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * PostgreSQL workload.
 *
 * A `PostgresDatabase` workload is initialized with:
 * - A database name.
 * - A stable database ID that references the database server where the database is located.
 *   Multiple workloads can point to the same database server.
 * - A client constructor function providing the client of your choice.
 *   The {@link PostgresDatabase.client | client } accessor will call this function and memoize its result.
 *
 * @example
 * ```ts
 * import { PostgreSQL } from "@monolayer/workloads";
 * import pg from "pg";
 *
 * export const db = new PostgreSQL(
 *   "app-db",
 *   {
 *     databaseId: "main",
 *     client:
 *       (envVarName) =>
 *         new pg.Pool({
 *           connectionString: process.env[connectionStringEnvVar],
 *       }),
 *   }
 * );
 *
 * // Querying with the client
 * await db.client.query("SELECT 1");
 * ```
 *
 * @typeParam C - Client type
 */
export class PostgresDatabase<C> extends Database<C> {
	/**
	 * @internal
	 */
	declare _brand: "PostgresDatabase";
	/**
	 * @internal
	 */
	get connStringComponents() {
		return ["pg", this.id, this.databaseName, "database"];
	}
}
