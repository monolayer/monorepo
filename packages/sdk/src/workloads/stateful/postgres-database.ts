import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * Workload for PostgreSQL databases.
 *
 * A `PostgresDatabase` workload is initialized with:
 * - A valid database name.
 *
 * The environment variable with the connection string for the database is named after
 * the `databaseName` and the `databaseId`. See examples.
 *
 * **NOTES**
 *
 * When launching the development or test containers with `npx workloads start dev`, the environment
 * variable with the connection string for the workload's Docker container
 * will be written to the corresponding dotenv file (`.env.local` or `.env.local.test`)
 *
 * @example
 * ```ts
 * import { PostgreSQL } from "@monolayer/sdk";
 * import pg from "pg";
 *
 * // Workloads on different database servers
 * export const producstDb = new PostgresDatabase("products");
 *
 * export const analyticsDb = new PostgresDatabase("analytics");
 * ```
 */
export class PostgresDatabase extends Database {
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
