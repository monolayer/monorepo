import { cancelOperation } from "@monorepo/cli/cancel-operation.js";
import { Effect, pipe } from "effect";
import { flatMap, succeed, tap, tryPromise } from "effect/Effect";
import prompts from "prompts";
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
			console.log(`The database '${dbName}' does not exist.`);
		}),
	),
	flatMap(() =>
		tryPromise(async () => {
			const response = await prompts({
				type: "confirm",
				name: "value",
				message: "Do you want to create it?",
				initial: false,
			});
			return response.value as boolean;
		}),
	),
	tap((promptConfirm) =>
		Effect.if(promptConfirm === true, {
			onTrue: () => createDatabase,
			onFalse: () => cancelOperation(),
		}),
	),
	flatMap(() => succeed("created" as const)),
);
