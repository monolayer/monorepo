import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { cancelOperation } from "../programs/cancel-operation.js";
import { adminDevPgQuery } from "../programs/pg-query.js";
import { DbClients } from "../services/dbClients.js";
import { createDevDatabase } from "./create.js";

export function handleMissingDatabase() {
	return checkDatabaseExists().pipe(
		Effect.flatMap((result) =>
			Effect.if(result.exists, {
				onTrue: () => Effect.succeed(true),
				onFalse: () =>
					Effect.tryPromise(async () => {
						p.log.warn(`The database '${result.databaseName}' does not exist.`);
						return await confirm({
							initialValue: false,
							message: `Do you want to create it?`,
						});
					}).pipe(
						Effect.flatMap((shouldContinue) =>
							Effect.if(shouldContinue === true, {
								onTrue: () => createDevDatabase(),
								onFalse: () => cancelOperation(),
							}),
						),
					),
			}),
		),
	);
}

function checkDatabaseExists() {
	return DbClients.pipe(
		Effect.flatMap((dbClients) =>
			adminDevPgQuery<{
				databaseExists: boolean;
			}>(
				`SELECT true as databaseExists FROM pg_database WHERE datname = '${dbClients.currentEnvironment.databaseName}'`,
			).pipe(
				Effect.flatMap((result) =>
					Effect.if(result.length !== 0, {
						onTrue: () =>
							Effect.succeed({
								databaseName: dbClients.currentEnvironment.databaseName,
								exists: true,
							}),
						onFalse: () =>
							Effect.succeed({
								databaseName: dbClients.currentEnvironment.databaseName,
								exists: false,
							}),
					}),
				),
			),
		),
	);
}
