import { adminPgQuery } from "@monorepo/services/db-clients/admin-pg-query.js";
import { connectionOptions } from "@monorepo/services/db-clients/connection-options.js";
import { Effect } from "effect";
import ora from "ora";

export const dropDatabase = Effect.gen(function* () {
	const spinner = ora();
	const databaseName = (yield* connectionOptions).databaseName;
	spinner.start(`Drop database ${databaseName}`);
	yield* adminPgQuery(`DROP DATABASE IF EXISTS "${databaseName}";`);
	spinner.succeed();
});
