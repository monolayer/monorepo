import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * Workload for MySQL databases.
 *
 * A `MySqlDatabase` workload is initialized with:
 * - A valid database name.
 * - A client constructor function providing the client of your choice.
 *   The {@link MySqlDatabase.client | client } accessor will call this function and memoize its result.
 *   The expected envirnoment variable name with the connection string is passed as an argument.
 * - An optional database server ID to reference the database server where the database is located.
 *   Multiple workloads can point to the same database server.
 *   By default, each `MySqlDatabase` points to a different database server.
 *
 * The environment variable with the connection string for the database is named after
 * the `databaseName` and the `databaseId`. See examples.
 *
 * **NOTES**
 *
 * When launching the development or test containers with `npx workloads start`, the environment
 * variable with the connection string for the workload's Docker container
 * will be written to the corresponding dotenv file (`.env` or `.env.test`)
 *
 * @example
 * ```ts
 * import { MySqlDatabase } from "@monolayer/workloads";
 * import mysql from 'mysql2/promise';
 *
 * // Workloads on different database servers
 *
 * export const productsDb = new MySqlDatabase(
 *   "products",
 *   {
 *     // envVarName -> MONO_MYSQL_PRODUCTS_DATABASE_URL
 *     client: async (envVarName) =>
 *       await mysql.createConnection(process.env[envVarName]!)
 *     ),
 *   }
 * );
 *
 * export const analyticsDb = new MySqlDatabase(
 *   "analytics",
 *   {
 *     // envVarName -> MONO_MYSQL_ANALYTICS_DATABASE_URL
 *     client: async (envVarName) =>
 *       await mysql.createConnection(process.env[envVarName]!)
 *     ),
 *   }
 * );
 *
 * // Workloads on the same database server
 *
 * export const productsDbMain = new MySqlDatabase(
 *   "products",
 *   {
 *     serverId: "main",
 *     // envVarName -> MONO_MYSQL_MAIN_PRODUCTS_DATABASE_URL
 *     client: async (envVarName) =>
 *       await mysql.createConnection(process.env[envVarName]!)
 *     ),
 *   }
 * );
 *
 * export const analyticsDbMain = new MySqlDatabase(
 *   "analytics",
 *   {
 *     serverId: "main",
 *     // envVarName -> MONO_MYSQL_MAIN_ANALYTICS_DATABASE_URL
 *     client: async (envVarName) =>
 *       await mysql.createConnection(process.env[envVarName]!)
 *     ),
 *   }
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
