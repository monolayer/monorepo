import { Effect } from "effect";
import { DbClients } from "../services/dbClients.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { adminPgQuery } from "./pg-query.js";

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
