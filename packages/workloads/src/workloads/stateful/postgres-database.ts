import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * Workload for PostgreSQL databases.
 *
 * A `PostgresDatabase` workload is initialized with:
 * - A valid database name.
 * - A client constructor function providing the client of your choice.
 *   The {@link PostgresDatabase.client | client } accessor will call this function and memoize its result.
 *   The expected envirnoment variable name with the connection string is passed as an argument.
 * - An optional database server ID to reference the database server where the database is located.
 *   Multiple workloads can point to the same database server.
 *   By default, each `PostgresDatabase` points to a different database server.
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
 * import { PostgreSQL } from "@monolayer/workloads";
 * import pg from "pg";
 *
 * // Workloads on different database servers
 * export const producstDb = new PostgresDatabase(
 *   "products",
 *   {
 *     client:
 *       // envVarName -> MONO_PG_PRODUCTS_DATABASE_URL
 *       (envVarName) =>
 *         new pg.Pool({
 *           connectionString: process.env[envVarName],
 *       }),
 *   }
 * );
 *
 * export const analyticsDb = new PostgresDatabase(
 *   "analytics",
 *   {
 *     client:
 *       // envVarName -> MONO_PG_ANALYTICS_DATABASE_URL
 *       (envVarName) =>
 *         new pg.Pool({
 *           connectionString: process.env[envVarName],
 *       }),
 *   }
 * );
 *
 * // Workloads in the same database server
 * export const producsDbMain = new PostgresDatabase(
 *   "products",
 *   {
 *     serverId: "main",
 *     client:
 *       // envVarName -> MONO_PG_MAIN_PRODUCTS_DATABASE_URL
 *       (envVarName) =>
 *         new pg.Pool({
 *           connectionString: process.env[envVarName],
 *       }),
 *   }
 * );
 *
 * export const analyticsDbMain = new PostgresDatabase(
 *   "analytics",
 *   {
 *     serverId: "main",
 *     client:
 *       // envVarName -> MONO_PG_MAIN_ANALYTICS_DATABASE_URL
 *       (envVarName) =>
 *         new pg.Pool({
 *           connectionString: process.env[envVarName],
 *       }),
 *   }
 * );
 *
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
	connStringPrefix(): string {
		return "pg";
	}
}
