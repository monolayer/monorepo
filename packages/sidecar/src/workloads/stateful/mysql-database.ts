import { Database } from "~sidecar/workloads/stateful/database.js";

/**
 * MySQL workload.
 *
 * @example
 * ```ts
 * import { MySqlDatabase } from "@monolayer/sidecar";
 * import mysql from 'mysql2/promise';
 *
 * export const db = new MySqlDatabase(
 *   "app-db",
 *   	"mysql-db",
 *   (connectionStringEnvVar) =>
 *     await mysql.createConnection(process.env[connectionStringEnvVar]!)
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class MySqlDatabase<C> extends Database<C> {
	get connStringComponents() {
		return ["mysql", this.id, this.databaseName];
	}
}
