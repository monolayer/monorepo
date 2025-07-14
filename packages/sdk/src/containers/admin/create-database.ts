import pg from "pg";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

export async function createPostgresDatabase(workload: PostgresDatabase) {
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

function adminCredentials(workload: PostgresDatabase) {
	return process.env[workload.connectionStringEnvVar]?.replace(
		/(\d)\/.+$/,
		"$1",
	);
}
