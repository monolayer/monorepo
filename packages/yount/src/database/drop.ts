import { Effect } from "effect";
import { adminPgQuery } from "~/services/db-clients.js";
import { spinnerTask } from "../cli/spinner-task.js";
import { DbClients } from "../services/db-clients.js";

export function dropDatabase(failSafe = false) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			spinnerTask(
				`Drop database ${clients.currentEnvironment.databaseName}`,
				() =>
					adminPgQuery(
						`DROP DATABASE ${failSafe ? "IF EXISTS" : ""} "${clients.currentEnvironment.databaseName}";`,
					),
			),
		),
	);
}
