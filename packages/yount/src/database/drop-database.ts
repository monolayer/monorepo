import { Effect } from "effect";
import { adminPgQuery } from "../programs/pg-query.js";
import { spinnerTask } from "../programs/spinner-task.js";
import { DbClients } from "../services/dbClients.js";

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
