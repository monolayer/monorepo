import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { adminPgQuery, DbClients } from "@monorepo/services/db-clients.js";
import { Effect } from "effect";

export function dropDatabase(failSafe = false) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			spinnerTask(`Drop database ${clients.databaseName}`, () =>
				adminPgQuery(
					`DROP DATABASE ${failSafe ? "IF EXISTS" : ""} "${clients.databaseName}";`,
				),
			),
		),
	);
}
