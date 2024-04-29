import { Effect } from "effect";
import { adminPgQuery } from "../programs/pg-query.js";
import { spinnerTask } from "../programs/spinner-task.js";
import { DbClients } from "../services/dbClients.js";

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

export function createDevDatabase() {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			spinnerTask(
				`Create database ${clients.developmentEnvironment.databaseName}`,
				() =>
					adminPgQuery(
						`CREATE DATABASE "${clients.developmentEnvironment.databaseName}";`,
					),
			),
		),
	);
}
