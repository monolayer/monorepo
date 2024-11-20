import mysql from "mysql2/promise";
import pg from "pg";
import type { MySqlDatabase } from "~workloads/workloads.js";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postgresDatabasePool(workload: PostgresDatabase<any>) {
	return new pg.Pool({
		connectionString: process.env[workload.connectionStringEnvVar],
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mysqlConnection(workload: MySqlDatabase<any>) {
	return await mysql.createConnection(
		process.env[workload.connectionStringEnvVar]!,
	);
}
