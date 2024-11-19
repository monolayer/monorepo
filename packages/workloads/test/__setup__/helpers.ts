import pg from "pg";
import type { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postgresDatabasePool(workload: PostgresDatabase<any>) {
	return new pg.Pool({
		connectionString: process.env[workload.connectionStringEnvVar()],
	});
}
