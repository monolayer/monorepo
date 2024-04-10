import { Effect } from "effect";
import { DbClients } from "../services/dbClients.js";
import { adminPgQuery } from "./pg-query.js";
import { spinnerTask } from "./spinner-task.js";

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
