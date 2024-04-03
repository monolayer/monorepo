import { Effect } from "effect";
import { environmentPool } from "~/cli/programs/environment-pool.js";
import { dropTablesAndTypes } from "~/cli/tasks/drop-tables-and-types.js";
import { dumpDatabaseStructureTask } from "~/cli/tasks/dump-database-structure.js";
import { cliAction } from "../utils/cli-action.js";

export async function dbClear(environment: string) {
	await cliAction("yount db:clear", [
		environmentPool(environment).pipe(
			Effect.tap(dropTablesAndTypes),
			Effect.tap(dumpDatabaseStructureTask),
		),
	]);
}
