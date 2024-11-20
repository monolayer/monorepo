import { Database } from "~sidecar/workloads/stateful/database.js";

/**
 * PostgreSQL workload.
 *
 *
 * @example
 * ```ts
 * import { PostgreSQL } from "@monolayer/sidecar";
 * import pg from "pg";
 *
 * export const db = new PostgreSQL(
 *   "app-db",
 *   (envVarName) =>
 *     new pg.Pool({
 *       connectionString: process.env[connectionStringEnvVar],
 *     }),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class PostgresDatabase<C> extends Database<C> {
	get connStringComponents() {
		return ["postgres", this.id, this.databaseName];
	}
}
