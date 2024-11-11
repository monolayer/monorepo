import { adminPgQuery } from "@monorepo/services/db-clients/admin-pg-query.js";
import { connectionOptions } from "@monorepo/services/db-clients/connection-options.js";
import { Effect } from "effect";
import ora from "ora";
import { databaseExists } from "~programs/database/database-exists.js";

export const createDatabase = Effect.gen(function* () {
	const spinner = ora();
	const databaseName = (yield* connectionOptions).databaseName;
	spinner.start(`Create database ${databaseName}`);
	if (!(yield* databaseExists)) {
		yield* adminPgQuery(`CREATE DATABASE "${databaseName}";`);
	}
	spinner.succeed();
});
