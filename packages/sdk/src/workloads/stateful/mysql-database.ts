import { Database } from "~workloads/workloads/stateful/database.js";

/**
 * Workload for MySQL databases.
 *
 * A `MySqlDatabase` workload is initialized with:
 * - A valid database name.
 *
 * The environment variable with the connection string for the database is named after
 * the `databaseName` and the `databaseId`. See examples.
 *
 * **NOTES**
 *
 * When launching the development or test containers with `npx workloads start dev`, the environment
 * variable with the connection string for the workload's Docker container
 * will be written to the corresponding dotenv file (`.env.local` or `.env.test.local`)
 *
 * @example
 * ```ts
 * import { MySqlDatabase } from "@monolayer/sdk";
 * import mysql from 'mysql2/promise';
 *
 * export const productsDb = new MySqlDatabase("products");
 *
 * ```
 */
export class MySqlDatabase extends Database {
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
