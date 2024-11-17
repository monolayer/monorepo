import { StatefulWorkloadWithClient } from "~sidecar/workloads/stateful/stateful-workload.js";

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
export class PostgresDatabase<C> extends StatefulWorkloadWithClient<C> {
	readonly databaseName: string;

	override connStringComponents = ["id" as const, "databaseName" as const];

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
		 * Client constructor function. Executed once when accessing the `client` property.
		 */
		client: (connectionStringVar: string) => C,
	) {
		super(databaseId, client);
		this.databaseName = databaseName;
	}
}

