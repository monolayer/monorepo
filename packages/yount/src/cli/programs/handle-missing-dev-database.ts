import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { Pg } from "../services/pg.js";
import { cancelOperation } from "./cancel-operation.js";
import { createDevDatabase } from "./create-database.js";
import { pgQuery } from "./pg-query.js";

export function handleMissingDevDatabase() {
	return Pg.pipe(
		Effect.flatMap((pg) =>
			pgQuery<{
				databaseExists: boolean;
			}>(
				`SELECT true as databaseExists FROM pg_database WHERE datname = '${pg.config.database}'`,
			).pipe(
				Effect.flatMap((result) =>
					Effect.if(result.length !== 0, {
						onTrue: Effect.succeed(true),
						onFalse: Effect.succeed(false),
					}),
				),
			),
		),
	).pipe(
		Effect.flatMap((result) =>
			Effect.if(typeof result === "boolean" && result, {
				onTrue: Effect.succeed(true),
				onFalse: Effect.tryPromise(async () => {
					p.log.warn(
						"Development database does not exist. Cannot generate migrations without a development database.",
					);
					return await confirm({
						initialValue: false,
						message: `Do you want to create the development database?`,
					});
				}).pipe(
					Effect.flatMap((shouldContinue) =>
						Effect.if(shouldContinue === true, {
							onTrue: createDevDatabase(),
							onFalse: cancelOperation(),
						}),
					),
				),
			}),
		),
	);
}
