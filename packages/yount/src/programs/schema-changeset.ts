import { Effect, pipe } from "effect";
import type { Kysely } from "kysely";
import { schemaChangeset as changeset } from "~/changeset/schema-changeset.js";
import { type CamelCaseOptions } from "~/configuration.js";
import { createSchemaChangeset } from "~/database/database_schemas/changeset.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { dbColumnInfo } from "~/database/schema/table/column/instrospection.js";
import { dbCheckConstraintInfo } from "~/database/schema/table/constraints/check/introspection.js";
import { dbForeignKeyConstraintInfo } from "~/database/schema/table/constraints/foreign-key/introspection.js";
import { dbPrimaryKeyConstraintInfo } from "~/database/schema/table/constraints/primary-key/introspection.js";
import { dbUniqueConstraintInfo } from "~/database/schema/table/constraints/unique/introspection.js";
import { dbIndexInfo } from "~/database/schema/table/index/introspection.js";
import { dbTableInfo } from "~/database/schema/table/introspection.js";
import { dbTriggerInfo } from "~/database/schema/table/trigger/introspection.js";
import { dbEnumInfo } from "~/database/schema/types/enum/introspection.js";
import {
	localSchema,
	type SchemaMigrationInfo,
} from "~/introspection/introspection.js";
import { DbClients } from "../services/dbClients.js";
import { DevEnvironment } from "../services/environment.js";

export function schemaChangeset() {
	return connectorSchemas().pipe(
		Effect.flatMap((schemas) =>
			Effect.all(schemas.flatMap(databaseChangeset)).pipe(
				Effect.flatMap((changesets) =>
					Effect.succeed(changesets.flatMap((changeset) => changeset)),
				),
			),
		),
	);
}

function databaseChangeset(database: AnySchema) {
	return Effect.all([DevEnvironment, DbClients]).pipe(
		Effect.flatMap(([devEnvironment, dbClients]) =>
			Effect.all([
				Effect.succeed(dbClients.developmentEnvironment.kyselyNoCamelCase),
				Effect.succeed(devEnvironment.camelCasePlugin),
				Effect.succeed(Schema.info(database).name || "public"),
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
	localDatabaseSchema: AnySchema,
	remoteSchema: SchemaMigrationInfo,
	camelCasePlugin?: CamelCaseOptions,
) {
	const cset = changeset(
		localSchema(
			localDatabaseSchema,
			remoteSchema,
			camelCasePlugin ?? { enabled: false },
		),
		remoteSchema,
		Schema.info(localDatabaseSchema).name || "public",
	);
	return Effect.succeed(cset);
}

function connectorSchemas() {
	return DevEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(environment.connector.schemas),
		),
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function databaseSchema(kysely: Kysely<any>, localSchema: AnySchema) {
	const schemaName = Schema.info(localSchema).name || "public";
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
				triggers,
				enums,
				checkConstraints,
			]) =>
				Effect.succeed({
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
