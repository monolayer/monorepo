import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { cancelOperation } from "@monorepo/base/programs/cancel-operation.js";
import { Effect, pipe } from "effect";
import { flatMap, succeed, tap, tryPromise } from "effect/Effect";
import { createDatabase } from "~programs/database/create-database.js";
import { databaseExists } from "~programs/database/database-exists.js";
import { databaseName } from "~programs/database/database-name.js";

export const handleMissingDatabase = databaseExists.pipe(
	flatMap((exists) =>
		Effect.if(exists, {
			onTrue: () => succeed("exists" as const),
			onFalse: () => createDatabasePrompt,
		}),
	),
);

const createDatabasePrompt = pipe(
	databaseName.pipe(
		tap((dbName) => {
			p.log.warn(`The database '${dbName}' does not exist.`);
		}),
	),
	flatMap(() =>
		tryPromise(() =>
			confirm({
				initialValue: false,
				message: `Do you want to create it?`,
			}),
		),
	),
	tap((promptConfirm) =>
		Effect.if(promptConfirm === true, {
			onTrue: () => createDatabase,
			onFalse: () => cancelOperation(),
		}),
	),
	flatMap(() => succeed("created" as const)),
);
