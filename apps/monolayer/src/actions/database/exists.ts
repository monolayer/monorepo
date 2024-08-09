import { DbClients, adminPgQuery } from "@monorepo/services/db-clients.js";
import { Effect } from "effect";

interface DatabaseExists {
	exists: boolean;
}

export const databaseExists = Effect.gen(function* () {
	const databaseName = (yield* DbClients).databaseName;
	const query = `SELECT true as exists FROM pg_database WHERE datname = '${databaseName}'`;
	const result = yield* adminPgQuery<DatabaseExists>(query);
	return result.length !== 0;
});
