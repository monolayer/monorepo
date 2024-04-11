import { DbContext } from "~tests/__setup__/helpers/kysely.js";

export async function dropTables(context: DbContext) {
	try {
		for (const tableName of context.tableNames) {
			await context.kysely.schema.dropTable(tableName).execute();
		}
	} catch {
		/* empty */
	}
}
