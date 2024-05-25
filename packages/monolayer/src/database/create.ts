import { Effect } from "effect";
import { adminPgQuery } from "~/services/db-clients.js";
import { currentDatabaseName } from "~/state/app-environment.js";
import { spinnerTask } from "../cli/spinner-task.js";

export const createDatabase = Effect.gen(function* () {
	const databaseName = yield* currentDatabaseName;
	yield* spinnerTask(`Create database ${databaseName}`, () =>
		adminPgQuery(`CREATE DATABASE "${databaseName}";`),
	);
});
