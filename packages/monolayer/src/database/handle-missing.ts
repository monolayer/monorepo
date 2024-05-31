import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { DbClients, adminPgQuery } from "~/services/db-clients.js";
import { cancelOperation } from "../cli/cancel-operation.js";
import { createDatabase } from "./create.js";

export const handleMissingDatabase = Effect.gen(function* () {
	if (yield* databaseExists) return true;

	if (yield* confirmDatabaseCreation) {
		return yield* createDatabase;
	} else {
		return yield* cancelOperation();
	}
});

interface DatabaseExists {
	exists: boolean;
}

const databaseExists = Effect.gen(function* () {
	const databaseName = (yield* DbClients).databaseName;
	const query = `SELECT true as exists FROM pg_database WHERE datname = '${databaseName}'`;
	const result = yield* adminPgQuery<DatabaseExists>(query);
	return result.length !== 0;
});

const confirmDatabaseCreation = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	p.log.warn(`The database '${dbClients.databaseName}' does not exist.`);

	const promptConfirm = yield* Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `Do you want to create it?`,
		}),
	);
	return promptConfirm === true;
});
