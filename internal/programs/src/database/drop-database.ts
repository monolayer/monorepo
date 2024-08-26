import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { adminPgQuery } from "@monorepo/services/db-clients/admin-pg-query.js";
import { Effect } from "effect";

export const dropDatabase = Effect.gen(function* () {
	const clients = yield* DbClients;
	yield* spinnerTask(`Drop database ${clients.databaseName}`, () =>
		adminPgQuery(`DROP DATABASE IF EXISTS "${clients.databaseName}";`),
	);
});
