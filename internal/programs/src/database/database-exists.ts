import { DbClients } from "@monorepo/services/db-clients.js";
import { adminPgQuery } from "@monorepo/services/db-clients/admin-pg-query.js";
import { Effect } from "effect";

export const databaseExists = Effect.gen(function* () {
	const databaseName = (yield* DbClients).databaseName;
	const query = `SELECT true as exists FROM pg_database WHERE datname = '${databaseName}'`;
	const result = yield* adminPgQuery<{ exists: boolean }>(query);
	return result.length !== 0;
});
