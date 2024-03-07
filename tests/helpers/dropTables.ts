import { DbContext } from "~tests/setup.js";

export async function dropTables(context: DbContext) {
	try {
		for (const tableName of context.tableNames) {
			await context.kysely.schema.dropTable(tableName).execute();
		}
	} catch {
		/* empty */
	}
}
