import { Effect } from "effect";
import color from "picocolors";
import { changeset } from "~/changeset/changeset.js";
import type { Config } from "~/config.js";
import {
	localSchema,
	type MigrationSchema,
} from "~/introspection/introspection.js";
import type { AnyPgDatabase } from "~/schema/pg-database.js";
import { generateMigrations } from "../components/generate-migrations.js";
import { Environment } from "../services/environment.js";
import { Db } from "../services/kysely.js";
import { abortEarlyWithSuccess } from "../utils/cli-action.js";
import { databaseSchema } from "./database-schema.js";
import { localDatabaseSchema } from "./local-schema.js";

export function generateChangesetMigration() {
	return Effect.all([Environment, Db]).pipe(
		Effect.flatMap(([environment, db]) =>
			Effect.all([
				databaseSchema(db.kysely),
				localDatabaseSchema(environment.config),
				Effect.succeed(environment.config),
			]).pipe(
				Effect.flatMap(([databaseSchema, localDatabaseSchema, config]) =>
					computeChangeset(localDatabaseSchema, databaseSchema, config).pipe(
						Effect.tap((changeset) =>
							Effect.tryPromise(async () => {
								await generateMigrations(changeset, config);
								return Effect.succeed(true);
							}),
						),
					),
				),
			),
		),
	);
}

export function computeChangeset(
	localDatabaseSchema: AnyPgDatabase,
	remoteSchema: MigrationSchema,
	config: Config,
) {
	const localInfo = localSchema(
		localDatabaseSchema,
		remoteSchema,
		config.camelCasePlugin ?? { enabled: false },
	);
	const cset = changeset(localInfo, remoteSchema);
	return Effect.succeed(cset).pipe(
		Effect.tap((cset) =>
			Effect.if(cset.length === 0, {
				onTrue: abortEarlyWithSuccess(
					`${color.green("Nothing to do")}. No schema changes found.`,
				),
				onFalse: Effect.unit,
			}),
		),
	);
}
