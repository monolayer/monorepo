import type { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import path from "path";
import { importConfig } from "~configuration/import-config.js";

export type DatabaseImport = Record<string, MonoLayerPgDatabase>;

export async function importDatabases() {
	const config = await importConfig();
	const databases: DatabaseImport = await import(
		path.join(process.cwd(), config.folder, "databases.ts")
	);
	return databases;
}
