import { Effect } from "effect";
import { currentDatabaseName } from "~/state/app-environment.js";
import { spinnerTask } from "../cli/spinner-task.js";
import { adminPgQuery } from "../services/db-clients.js";
import { databaseExists } from "./exists.js";

export const createDatabase = Effect.gen(function* () {
	const databaseName = yield* currentDatabaseName;
	yield* spinnerTask(`Create database ${databaseName}`, () =>
		Effect.gen(function* () {
			const exists = yield* databaseExists;
			if (exists) return true;
			yield* adminPgQuery(`CREATE DATABASE "${databaseName}";`);
		}),
	);
});
