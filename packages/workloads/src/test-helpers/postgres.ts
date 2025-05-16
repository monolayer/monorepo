import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

/**
 * Truncates all the tables in a {@link PostgresDatabase} workload.
 */
export async function truncatePostgresTables(
	/**
	 * PostgresDatabase workload
	 */

	workload: PostgresDatabase,
	/**
	 * Schema name (default: `public`)
	 */
	schemaName?: string,
) {
	const pg = await import("pg");
	const pool = new pg.Pool({
		connectionString: process.env[workload.connectionStringEnvVar],
	});
	const result = await pool.query<{
		table_name: string;
		schema_name: string;
	}>(`
		SELECT c.relname as table_name, n.nspname as schema_name
		FROM pg_class c LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = '${schemaName ?? "public"}'
		AND c.relkind IN ('r','p');`);

	const tables = result.rows;
	const queries = tables.map(
		(table) =>
			`TRUNCATE TABLE ${table.schema_name}.${table.table_name} RESTART IDENTITY CASCADE;`,
	);
	await pool.query(queries.join("\n"));
	await pool.end();
}
