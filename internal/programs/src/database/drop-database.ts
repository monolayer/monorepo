import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { adminPgQuery, DbClients } from "@monorepo/services/db-clients.js";
import { Effect } from "effect";

export const dropDatabase = Effect.gen(function* () {
	const clients = yield* DbClients;
	yield* spinnerTask(`Drop database ${clients.databaseName}`, () =>
		adminPgQuery(`DROP DATABASE IF EXISTS "${clients.databaseName}";`),
	);
});
