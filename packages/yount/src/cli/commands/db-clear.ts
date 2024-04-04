import { dropTablesAndTypes } from "~/cli/programs/drop-tables-and-types.js";
import { dumpDatabaseStructureTask } from "../programs/dump-database-structure.js";
import { cliAction } from "../utils/cli-action.js";

export async function dbClear(environment: string) {
	await cliAction("yount db:clear", environment, [
		dropTablesAndTypes(),
		dumpDatabaseStructureTask(),
	]);
}
