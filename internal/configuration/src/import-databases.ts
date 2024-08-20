import type { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import { pipe } from "effect";
import { flatMap, tryPromise } from "effect/Effect";
import path from "path";
import { importConfig } from "~configuration/import-config.js";

export type DatabaseImport = Record<string, MonoLayerPgDatabase>;

export const importDatabases = pipe(
	importConfig,
	flatMap((config) =>
		tryPromise(
			(): Promise<DatabaseImport> =>
				import(path.join(process.cwd(), config.folder, "databases.ts")),
		),
	),
);
