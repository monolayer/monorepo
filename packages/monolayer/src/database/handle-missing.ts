import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import {
	adminDevPgQuery,
	currentEnvironmentDatabaseName,
} from "~/services/db-clients.js";
import { cancelOperation } from "../cli/cancel-operation.js";
import { createDevDatabase } from "./create.js";

export const handleMissingDatabase = Effect.gen(function* () {
	if (yield* databaseExists) return true;

	if (yield* confirmDatabaseCreation) {
		return yield* createDevDatabase();
	} else {
		return yield* cancelOperation();
	}
});

interface DatabaseExists {
	exists: boolean;
}

const databaseExists = Effect.gen(function* () {
	const databaseName = yield* currentEnvironmentDatabaseName;
	const query = `SELECT true as exists FROM pg_database WHERE datname = '${databaseName}'`;
	const result = yield* adminDevPgQuery<DatabaseExists>(query);
	return result.length !== 0;
});

const confirmDatabaseCreation = Effect.gen(function* () {
	p.log.warn(
		`The database '${yield* currentEnvironmentDatabaseName}' does not exist.`,
	);

	const promptConfirm = yield* Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `Do you want to create it?`,
		}),
	);
	return promptConfirm === true;
});
