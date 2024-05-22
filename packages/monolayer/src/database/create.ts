import { Effect } from "effect";
import { adminPgQuery } from "~/services/db-clients.js";
import { spinnerTask } from "../cli/spinner-task.js";
import { DbClients } from "../services/db-clients.js";

export function createDatabase() {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			spinnerTask(
				`Create database ${clients.currentEnvironment.databaseName}`,
				() =>
					adminPgQuery(
						`CREATE DATABASE "${clients.currentEnvironment.databaseName}";`,
					),
			),
		),
	);
}
