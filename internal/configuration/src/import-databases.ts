import { ActionError } from "@monorepo/cli/errors.js";
import type { PgDatabase } from "@monorepo/pg/database.js";
import { importFile } from "@monorepo/utils/import-file.js";
import { fail, gen } from "effect/Effect";
import path from "path";
import { importConfig } from "~configuration/import-config.js";

export const allDatabases = gen(function* () {
	const config = yield* importConfig;
	const databases = yield* importFile<Record<string, PgDatabase>>(
		path.join(process.cwd(), config.databases),
	);
	return databases !== undefined ? databases : yield* missingDatabases;
});

const missingDatabases = fail(
	new ActionError(
		"Missing configurations",
		"No configurations found. Check your databases.ts file.",
	),
);
