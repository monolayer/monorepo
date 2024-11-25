import mysql from "mysql2/promise";
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
	const connection = await mysql.createConnection(
		process.env[workload.connectionStringEnvVar]!,
	);
	const tables = await tablesInDatabase(connection, workload.databaseName);
	await truncateTablesInDatabase(connection, tables);
	await connection.end();
}

/**
 * @internal
 */
async function tablesInDatabase(
	connection: mysql.Connection,
	databaseName: string,
) {
	const [result] = await connection.query<mysql.RowDataPacket[]>(`
		SELECT table_name as table_name
		FROM information_schema.tables
		WHERE table_schema = '${databaseName}';
	`);
	return result as { table_name: string }[];
}

/**
 * @internal
 */
async function truncateTablesInDatabase(
	connection: mysql.Connection,
	tables: { table_name: string }[],
) {
	await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
	for (const table of tables) {
		await connection.query(`TRUNCATE TABLE ${table.table_name};`);
	}
	await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
}
