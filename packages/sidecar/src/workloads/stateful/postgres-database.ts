import { snakeCase } from "case-anything";
import {
	type StatefulWorkload,
	type WorkloadClient,
} from "~sidecar/workloads/stateful/interfaces.js";

/**
 * PostgreSQL workload.
 *
 * @example
 * ```ts
 * import { PostgreSQL } from "@monolayer/sidecar";
 * import pg from "pg";
 *
 * export const db = new PostgreSQL(
 *   "app-db",
 *   (connectionStringEnvVar) =>
 *     new pg.Pool({
 *       connectionString: process.env[connectionStringEnvVar],
 *     }),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class PostgresDatabase<C>
	implements StatefulWorkload, WorkloadClient<C>
{
	stateful!: true;
	readonly id: string;
	readonly databaseName: string;

	constructor(
		/**
		 * Database name.
		 */
		databaseName: string,
		/**
		 * Database ID
		 */
		databaseId: string,
		/**
		 * Client constructor function. Executed once when accessing the {@link PostgresDatabase.client }
		 */
		client: (connectionStringVar: string) => C,
	) {
		this.id = databaseId;
		this.databaseName = databaseName;
		this.#clientConstructor = client;
	}

	#client?: C | never;
	#clientConstructor: (connectionStringVar: string) => C;

	/**
	 * Return the client by calling the client constructor function.
	 *
	 * The client is memoized.
	 */
	get client(): C {
		if (this.#client) {
			return this.#client;
		}
		this.#client = this.#clientConstructor(this.connectionStringEnvVar());
		return this.#client;
	}

	/**
	 * Environment variable that should holds the workload connection string.
	 *
	 * Format: `WL_${workloadName}_${kebabCase(databaseId)}_${kebabCase(databaseName)}_URL`.toUpperCase()
	 * @example
	 *
	 * export const db = new PostgreSQL(
	 *   "analytics",
	 *   "app-db",
	 *   // connectionStringEnvVar: WL_POSTGRESQL_APP_DB_ANALYTICS_URL
	 *   (connectionStringEnvVar) =>
	 *     new pg.Pool({
	 *       connectionString: process.env[connectionStringEnvVar],
	 *     }),
	 * );
	 */
	connectionStringEnvVar() {
		return snakeCase(
			`WL_POSTGRESQL_${this.id}_${this.databaseName}_url`,
		).toUpperCase();
	}
}

