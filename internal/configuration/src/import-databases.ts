import type { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import { importFile } from "@monorepo/utils/import-file.js";
import { pipe } from "effect";
import { flatMap } from "effect/Effect";
import path from "path";
import { importConfig } from "~configuration/import-config.js";

export type DatabaseImport = Record<string, MonoLayerPgDatabase>;

export const importDatabases = pipe(
	importConfig,
	flatMap((config) =>
		importFile<DatabaseImport>(
			path.join(process.cwd(), config.entryPoints.databases),
		),
	),
);
