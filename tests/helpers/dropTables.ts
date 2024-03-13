import { DbContext } from "~tests/setup/kysely.js";

export async function dropTables(context: DbContext) {
	try {
		for (const tableName of context.tableNames) {
			await context.kysely.schema.dropTable(tableName).execute();
		}
	} catch {
		/* empty */
	}
}
