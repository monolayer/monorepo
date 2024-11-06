import { assert } from "vitest";
import type { TableColumnInfo } from "~db-push/changeset/types/schema.js";
import type { TestContext } from "../setup.js";

export function assertTable(tables: TableColumnInfo, tableName: string) {
	const table = tables[tableName];
	assert(table, `Table "${tableName}" is undefined`);
	return table;
}

export async function assertTableInDb(
	context: TestContext,
	schemaName: string,
	tableName: string,
) {
	const result = await context.dbClient
		.selectFrom("information_schema.tables")
		.select("table_name")
		.where("table_schema", "=", schemaName)
		.where("table_name", "=", tableName)
		.execute();
	assert(
		result.length !== 0,
		`Table "${tableName}" not in "${schemaName}" schema`,
	);
}

export function refuteTable(tables: TableColumnInfo, tableName: string) {
	const table = tables[tableName];
	assert.isUndefined(table, `Table "${tableName}" is defined`);
}
