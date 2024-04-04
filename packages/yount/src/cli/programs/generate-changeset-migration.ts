import * as p from "@clack/prompts";
import { Effect, pipe } from "effect";
import type { Kysely } from "kysely";
import color from "picocolors";
import { changeset } from "~/changeset/changeset.js";
import { importSchema, type Config } from "~/config.js";
import {
	localSchema,
	type MigrationSchema,
} from "~/introspection/introspection.js";
import { dbExtensionInfo } from "~/schema/extension/introspection.js";
import type { AnyPgDatabase } from "~/schema/pg-database.js";
import { dbColumnInfo } from "~/schema/table/column/instrospection.js";
import { dbCheckConstraintInfo } from "~/schema/table/constraints/check/introspection.js";
import { dbForeignKeyConstraintInfo } from "~/schema/table/constraints/foreign-key/introspection.js";
import { dbPrimaryKeyConstraintInfo } from "~/schema/table/constraints/primary-key/introspection.js";
import { dbUniqueConstraintInfo } from "~/schema/table/constraints/unique/introspection.js";
import { dbIndexInfo } from "~/schema/table/index/introspection.js";
import { dbTableInfo } from "~/schema/table/introspection.js";
import { dbTriggerInfo } from "~/schema/table/trigger/introspection.js";
import { dbEnumInfo } from "~/schema/types/enum/introspection.js";
import { generateMigrations } from "../components/generate-migrations.js";
import { Environment } from "../services/environment.js";
import { Db } from "../services/kysely.js";
import { ExitWithSuccess, abortEarlyWithSuccess } from "../utils/cli-action.js";

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

function computeChangeset(
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

function localDatabaseSchema(config: Config) {
	return Effect.tryPromise(async () => await importSchema()).pipe(
		Effect.flatMap((localSchemaFile) => {
			if (localSchemaFile.database === undefined) {
				p.log.warning(
					`Nothing to do. No database schema exported at ${config.folder}/schema.ts.`,
				);
				return Effect.fail(
					new ExitWithSuccess({
						cause: "No database schema exported found",
					}),
				);
			} else {
				return Effect.succeed(localSchemaFile.database);
			}
		}),
	);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function databaseSchema(kysely: Kysely<any>) {
	return pipe(
		databaseTableInfo(kysely),
		Effect.flatMap(tableList),
		Effect.flatMap((tables) => databaseInfo(kysely, "public", tables)),
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function databaseTableInfo(kysely: Kysely<any>) {
	return Effect.tryPromise(async () => await dbTableInfo(kysely, "public"));
}
function tableList(tables: Awaited<ReturnType<typeof dbTableInfo>>) {
	const tableList = tables.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);
	return Effect.succeed(tableList);
}

function databaseInfo(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	schema: string,
	tables: string[],
) {
	return Effect.all([
		Effect.tryPromise(async () => await dbColumnInfo(kysely, schema, tables)),
		Effect.tryPromise(async () => await dbIndexInfo(kysely, schema, tables)),
		Effect.tryPromise(
			async () => await dbUniqueConstraintInfo(kysely, schema, tables),
		),
		Effect.tryPromise(
			async () => await dbForeignKeyConstraintInfo(kysely, schema, tables),
		),
		Effect.tryPromise(
			async () => await dbPrimaryKeyConstraintInfo(kysely, schema, tables),
		),
		Effect.tryPromise(async () => await dbExtensionInfo(kysely, schema)),
		Effect.tryPromise(async () => await dbTriggerInfo(kysely, schema, tables)),
		Effect.tryPromise(async () => await dbEnumInfo(kysely, schema)),
		Effect.tryPromise(
			async () => await dbCheckConstraintInfo(kysely, schema, tables),
		),
	]).pipe(
		Effect.flatMap(
			([
				columns,
				indexes,
				uniqueConstraints,
				foreignKeys,
				primaryKeys,
				extensions,
				triggers,
				enums,
				checkConstraints,
			]) =>
				Effect.succeed({
					extensions: extensions,
					table: columns,
					index: indexes,
					foreignKeyConstraints: foreignKeys,
					uniqueConstraints: uniqueConstraints,
					checkConstraints: checkConstraints,
					primaryKey: primaryKeys,
					triggers: triggers,
					enums: enums,
				}),
		),
	);
}
