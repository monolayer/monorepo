import mysql from "mysql2/promise";
import pg from "pg";
import type { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

export async function createPostgresDatabase<C>(workload: PostgresDatabase<C>) {
	const client = new pg.Pool({
		connectionString: adminCredentials(workload),
	});
	const exists = await client.query(
		`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${workload.databaseName}'`,
	);

	if (exists.rowCount === 0) {
		await client.query(`CREATE DATABASE "${workload.databaseName}";`);
	}
	await client.end();
}

export async function createMysqlDatabase<C>(workload: MySqlDatabase<C>) {
	const connection = await mysql.createConnection(adminCredentials(workload)!);
	await connection.query(
		`CREATE DATABASE IF NOT EXISTS ${workload.databaseName};`,
	);
	await connection.end();
}

function adminCredentials<C>(workload: MySqlDatabase<C> | PostgresDatabase<C>) {
	return process.env[workload.connectionStringEnvVar]?.replace(
		/(\d)\/.+$/,
		"$1",
	);
}
