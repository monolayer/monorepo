import type { PgDatabase } from "@monorepo/pg/database.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { globalPool } from "../setup.js";

export function testLayers(
	databaseName: string,
	migrationFolder: string,
	database: PgDatabase,
) {
	return DbClients.TestLayer(globalPool(), databaseName, database.camelCase);
}
