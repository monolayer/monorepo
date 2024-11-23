import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * MySQL database workload.
 *
 * A `MySqlDatabase` workload is initialized with:
 * - A database name.
 * - A stable database ID that references the database server where the database is located.
 *   Multiple workloads can point to the same database server.
 * - A client constructor function providing the client of your choice.
 *   The {@link MySqlDatabase.client | client } accessor will call this function and memoize its result.
 *
 * @example
 * ```ts
 * import { MySqlDatabase } from "@monolayer/workloads";
 * import mysql from 'mysql2/promise';
 *
 * export const db = new MySqlDatabase(
 *   "app-db",
 *   {
 *     databaseId: "mysql-db",
 *     client: async (envVarName) =>
 *       await mysql.createConnection(process.env[envVarName]!)
 *     ),
 *   }
 *
 * // Querying with the client
 * const client = await db.client;
 * await client.query("SELECT 1");
 * ```
 *
 * @typeParam C - Client type
 */
export class MySqlDatabase<C> extends Database<C> {
	/**
	 * @internal
	 */
	declare _brand: "MySqlDatabase";

	/**
	 * @internal
	 */
	connStringPrefix(): string {
		return "mysql";
	}
}
