import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { cancelOperation } from "@monorepo/base/programs/cancel-operation.js";
import { createDatabase } from "@monorepo/programs/create-database.js";
import { databaseExists } from "@monorepo/programs/database-exists.js";
import { DbClients } from "@monorepo/services/db-clients.js";

import { Effect } from "effect";
export const handleMissingDatabase = Effect.gen(function* () {
	if (yield* databaseExists) return true;

	if (yield* confirmDatabaseCreation) {
		return yield* createDatabase;
	} else {
		return yield* cancelOperation();
	}
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
