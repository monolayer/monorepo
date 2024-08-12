import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import {
	adminPgQuery,
	connectionOptions,
} from "@monorepo/services/db-clients.js";
import { Effect } from "effect";
import { databaseExists } from "./exists.js";

export const createDatabase = Effect.gen(function* () {
	const databaseName = (yield* connectionOptions).databaseName;
	yield* spinnerTask(`Create database ${databaseName}`, () =>
		Effect.gen(function* () {
			const exists = yield* databaseExists;
			if (exists) return true;
			yield* adminPgQuery(`CREATE DATABASE "${databaseName}";`);
		}),
	);
});
