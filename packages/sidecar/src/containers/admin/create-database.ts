import { Pool } from "pg";
import type { PostgresDatabase } from "~sidecar/resources.js";

export async function createDatabase<C>(resource: PostgresDatabase<C>) {
	const client = new Pool({
		connectionString: process.env[resource.connectionStringEnvVar()]?.replace(
			/\/\w+$/,
			"",
		),
	});
	const exists = await client.query(
		`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${resource.databaseName}'`,
	);

	if (exists.rowCount === 0) {
		await client.query(`CREATE DATABASE "${resource.databaseName}";`);
	}
	await client.end();
}
