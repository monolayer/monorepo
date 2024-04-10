import { Effect } from "effect";
import { DbClients } from "../services/dbClients.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { adminPgQuery } from "./pg-query.js";

export function createDatabase() {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			spinnerTask(
				`Create database ${clients.currentEnvironment.pgConfig.database}`,
				() =>
					adminPgQuery(
						`CREATE DATABASE "${clients.currentEnvironment.pgConfig.database}";`,
					),
			),
		),
	);
}

export function createDevDatabase() {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			spinnerTask(
				`Create database ${clients.developmentEnvironment.pgConfig.database}`,
				() =>
					adminPgQuery(
						`CREATE DATABASE "${clients.developmentEnvironment.pgConfig.database}";`,
					),
			),
		),
	);
}
