import { Pool } from "pg";
import type { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";

export async function createDatabase<C>(workload: PostgresDatabase<C>) {
	const client = new Pool({
		connectionString: process.env[workload.connectionStringEnvVar()]?.replace(
			/\/\w+$/,
			"",
		),
	});
	const exists = await client.query(
		`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${workload.databaseName}'`,
	);

	if (exists.rowCount === 0) {
		await client.query(`CREATE DATABASE "${workload.databaseName}";`);
	}
	await client.end();
}
