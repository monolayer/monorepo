import type { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";

/**
 * Truncates all the tables in a {@link MySqlDatabase} workload.
 */
export async function truncateMySqlTables(
	/**
	 * MySqlDatabase workload
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	workload: MySqlDatabase<any>,
) {
	const mysql = await import("mysql2/promise");
	const connection = await mysql.createConnection(
		process.env[workload.connectionStringEnvVar]!,
	);
	const [result] = await connection.query(`
		SELECT table_name as table_name
		FROM information_schema.tables
		WHERE table_schema = '${workload.databaseName}';
	`);
	const tables = result as { table_name: string }[];
	await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
	for (const table of tables) {
		await connection.query(`TRUNCATE TABLE ${table.table_name};`);
	}
	await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
	await connection.end();
}
