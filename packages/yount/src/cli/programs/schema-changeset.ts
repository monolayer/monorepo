import { Effect, pipe } from "effect";
import type { Kysely } from "kysely";
import { changeset } from "~/changeset/changeset.js";
import { importConnector } from "~/config.js";
import { type CamelCaseOptions } from "~/configuration.js";
import {
	localSchema,
	type MigrationSchema,
} from "~/introspection/introspection.js";
import { createSchemaChangeset } from "~/schema/database_schemas/changeset.js";
import { schemaInDb } from "~/schema/database_schemas/introspection.js";
import { dbExtensionInfo } from "~/schema/extension/introspection.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg-database.js";
import { dbColumnInfo } from "~/schema/table/column/instrospection.js";
import { dbCheckConstraintInfo } from "~/schema/table/constraints/check/introspection.js";
import { dbForeignKeyConstraintInfo } from "~/schema/table/constraints/foreign-key/introspection.js";
import { dbPrimaryKeyConstraintInfo } from "~/schema/table/constraints/primary-key/introspection.js";
import { dbUniqueConstraintInfo } from "~/schema/table/constraints/unique/introspection.js";
import { dbIndexInfo } from "~/schema/table/index/introspection.js";
import { dbTableInfo } from "~/schema/table/introspection.js";
import { dbTriggerInfo } from "~/schema/table/trigger/introspection.js";
import { dbEnumInfo } from "~/schema/types/enum/introspection.js";
import { DevEnvironment } from "../services/environment.js";
import { DevDb } from "../services/kysely.js";

export function schemaChangeset() {
	return localDatabaseSchema().pipe(
		Effect.flatMap((localDatabaseSchema) =>
			Effect.all(localDatabaseSchema.flatMap(databaseChangeset)).pipe(
				Effect.flatMap((changesets) =>
					Effect.succeed(changesets.flatMap((changeset) => changeset)),
				),
			),
		),
	);
}

function databaseChangeset(database: AnyPgDatabase) {
	return Effect.all([DevEnvironment, DevDb]).pipe(
		Effect.flatMap(([devEnvironment, devDb]) =>
			Effect.all([
				Effect.succeed(devDb.kyselyNoCamelCase),
				Effect.succeed(devEnvironment.camelCasePlugin),
				Effect.succeed(PgDatabase.info(database).schema || "public"),
			]),
		),
		Effect.flatMap(([kyselyInstance, camelCasePlugin, schemaName]) =>
			databaseSchema(kyselyInstance, database).pipe(
				Effect.flatMap((databaseSchema) =>
					computeChangeset(database, databaseSchema, camelCasePlugin),
				),
				Effect.tap((changeset) =>
					Effect.tryPromise(() => schemaInDb(kyselyInstance, schemaName)).pipe(
						Effect.flatMap((schemaInDatabase) =>
							Effect.succeed(schemaInDatabase.length !== 0),
						),
						Effect.tap((exists) => {
							if (exists === false) {
								changeset.unshift(createSchemaChangeset(schemaName));
							}
						}),
					),
				),
			),
		),
	);
}

function computeChangeset(
	localDatabaseSchema: AnyPgDatabase,
	remoteSchema: MigrationSchema,
	camelCasePlugin?: CamelCaseOptions,
) {
	const cset = changeset(
		localSchema(
			localDatabaseSchema,
			remoteSchema,
			camelCasePlugin ?? { enabled: false },
		),
		remoteSchema,
		PgDatabase.info(localDatabaseSchema).schema || "public",
	);
	return Effect.succeed(cset);
}

function localDatabaseSchema() {
	return DevEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.tryPromise(() => importConnector()).pipe(
				Effect.flatMap((connectionImport) =>
					Effect.succeed(connectionImport.connectors || {}),
				),
				Effect.flatMap((allConnectors) => {
					const connection = Object.entries(allConnectors).find(([key]) => {
						return key === environment.connectorName;
					});
					if (connection === undefined) {
						return Effect.fail(
							`Connection ${environment.connectorName} not found. Check your connectors.ts file.`,
						);
					} else {
						return Effect.succeed(connection[1].databaseSchema);
					}
				}),
			),
		),
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function databaseSchema(kysely: Kysely<any>, localSchema: AnyPgDatabase) {
	const schemaName = PgDatabase.info(localSchema).schema || "public";
	return pipe(
		databaseTableInfo(kysely, schemaName),
		Effect.flatMap(tableList),
		Effect.flatMap((tables) => databaseInfo(kysely, schemaName, tables)),
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function databaseTableInfo(kysely: Kysely<any>, schemaName = "public") {
	return Effect.tryPromise(async () => await dbTableInfo(kysely, schemaName));
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
