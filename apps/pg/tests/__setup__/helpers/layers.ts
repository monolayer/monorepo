import type { PgDatabase } from "@monorepo/pg/database.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { Migrator } from "@monorepo/services/migrator.js";
import { Layer } from "effect";
import { globalPool } from "../setup.js";

export function testLayers(
	databaseName: string,
	migrationFolder: string,
	database: PgDatabase,
) {
	return Migrator.TestLayer(
		databaseName,
		migrationFolder,
		database.camelCase,
	).pipe(
		Layer.provideMerge(
			DbClients.TestLayer(globalPool(), databaseName, database.camelCase),
		),
	);
}
