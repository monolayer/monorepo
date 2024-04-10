import { Effect } from "effect";
import { DbClients } from "../services/dbClients.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { adminPgQuery } from "./pg-query.js";

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
