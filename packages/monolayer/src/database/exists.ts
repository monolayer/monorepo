import { Effect } from "effect";
import { DbClients, adminPgQuery } from "../services/db-clients.js";

interface DatabaseExists {
	exists: boolean;
}

export const databaseExists = Effect.gen(function* () {
	const databaseName = (yield* DbClients).databaseName;
	const query = `SELECT true as exists FROM pg_database WHERE datname = '${databaseName}'`;
	const result = yield* adminPgQuery<DatabaseExists>(query);
	return result.length !== 0;
});
