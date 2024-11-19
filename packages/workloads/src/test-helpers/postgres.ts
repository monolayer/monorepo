import pg from "pg";
import type { PostgresDatabase } from "~sidecar/workloads.js";

/**
 * Truncates all the tables in a {@link PostgresDatabase} workload.
 */
export async function truncatePostgresTables(
	/**
	 * PostgresDatabase workflow
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	workload: PostgresDatabase<any>,
	/**
	 * Schema name (default: `public`)
	 */
	schemaName?: string,
) {
	const pool = new pg.Pool({
		connectionString: process.env[workload.connectionStringEnvVar()],
	});
	const tables = await tablesInSchema(pool, schemaName ?? "public");
	await truncateTablesInSchema(pool, tables);
	await pool.end();
}

/**
 * @internal
 */
async function tablesInSchema(pool: pg.Pool, schema: string) {
	const result = await pool.query<{
		table_name: string;
		schema_name: string;
	}>(`
		SELECT c.relname as table_name, n.nspname as schema_name
		FROM pg_class c LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = '${schema}'
		AND c.relkind IN ('r','p');`);
	return result.rows;
}

/**
 * @internal
 */
async function truncateTablesInSchema(
	pool: pg.Pool,
	tableAndSchemas: { table_name: string; schema_name: string }[],
) {
	const queries = tableAndSchemas.map(
		(tableAndSchema) =>
			`TRUNCATE TABLE ${tableAndSchema.schema_name}.${tableAndSchema.table_name} RESTART IDENTITY CASCADE;`,
	);
	await pool.query(queries.join("\n"));
}
