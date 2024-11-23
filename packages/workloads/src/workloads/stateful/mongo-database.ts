import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * Workload for MongoDB databases.
 *
 * The `MongoDatabase` workload is initialized with:
 * - A valid database name.
 * - A client constructor function providing the client of your choice.
 *   The {@link MongoDatabase.client | client } accessor will call this function and memoize its result.
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
 *
 * ```ts
 * import { MongoDatabase } from "@monolayer/workloads";
 * import { MongoClient } from "mongodb";
 *
 * // Workloads on different database servers
 * const producsDb = new MongoDatabase("products", {
 *   // envVarName -> MONO_MONGODB_PRODUCTS_DATABASE_URL
 *   client: (envVarName) =>
 *     new MongoClient(process.env[envVarName]),
 * });
 *
 * const analyticsDb = new MongoDatabase("analytics", {
 *   // envVarName -> MONO_MONGODB_ANALYTICS_DATABASE_URL
 *   client: (envVarName) =>
 *     new MongoClient(process.env[envVarName]),
 * });
 *
 * // Workloads on the same database servers
 * const producsDbMain = new MongoDatabase("products", {
 *   serverId: "main",
 *   // envVarName -> MONO_MONGODB_MAIL_PRODUCTS_DATABASE_URL
 *   client: (envVarName) =>
 *     new MongoClient(process.env[envVarName]),
 * });
 *
 * const analyticsDbMain = new MongoDatabase("analytics", {
 *   serverId: "main",
 *   // envVarName -> MONO_MONGODB_MAIL_ANALYTICS_DATABASE_URL
 *   client: (envVarName) =>
 *     new MongoClient(process.env[envVarName]),
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
