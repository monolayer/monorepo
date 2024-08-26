import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { adminPgQuery } from "@monorepo/services/db-clients/admin-pg-query.js";
import { connectionOptions } from "@monorepo/services/db-clients/connection-options.js";
import { Effect } from "effect";
import { databaseExists } from "~programs/database/database-exists.js";

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
