import { type Kysely, sql } from "kysely";
import type { CamelCaseOptions } from "~/camel-case-options.js";
import { toSnakeCase } from "~/helpers/to-snake-case.js";
import {
	type BuilderContext,
	ForeignKeyBuilder,
} from "~/introspection/introspection/foreign-key-builder.js";
import { currentTableName } from "~/introspection/introspection/table-name.js";
import type { InformationSchemaDB } from "~/introspection/introspection/types.js";
import type {
	ColumnsToRename,
	ForeignKeyInfo,
	TablesToRename,
} from "~/introspection/schema.js";
import {
	type ForeignKeyIntrospection,
	tableInfo,
} from "~/introspection/table.js";
import type { ForeignKeyRule } from "~/schema/foreign-key.js";
import { type AnySchema, Schema } from "~/schema/schema.js";

export async function dbForeignKeyConstraints(
	fetchInfo: Awaited<ReturnType<typeof fetchForeignConstraintInfo>>,
	builderContextNew: BuilderContext,
) {
	const transformedResults = fetchInfo.reduce<{
		info: ForeignKeyInfo;
		definitions: Record<string, Record<string, ForeignKeyIntrospection>>;
	}>(
		(acc, result) => {
			const builderContext = {
				camelCase: { enabled: false },
				tablesToRename: [],
				columnsToRename: {},
				schemaName: result.schemaName,
				external: false,
			};
			const foreignKey = {
				...result,
				isExternal: true,
			};
			const builder = new ForeignKeyBuilder(
				result.table,
				foreignKey,
				builderContext,
			);

			const ancientBuilder = new ForeignKeyBuilder(
				currentTableName(
					result.table,
					builderContextNew.tablesToRename,
					builderContextNew.schemaName,
				),
				foreignKey,
				builderContextNew,
			);

			const previousHash = ancientBuilder.hash("previous");
			const table = result.table;
			if (table !== null) {
				acc.info[table] = {
					...acc.info[table],
					...{
						[`${previousHash}`]: builder.build("preserve", result.conname!),
					},
				};
				const definition = builder.definition("preserve");
				acc.definitions[table] = {
					...acc.definitions[table],
					...{
						[`${previousHash}`]: {
							columns: definition.columns,
							targetColumns: definition.targetColumns,
							targetTable: definition.targetTable,
							deleteRule: definition.onDelete as ForeignKeyRule,
							updateRule: definition.onUpdate as ForeignKeyRule,
							isExternal: false,
						},
					},
				};
			}
			return acc;
		},
		{ info: {}, definitions: {} },
	);
	return transformedResults;
}

export async function fetchForeignConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
	builderContext: BuilderContext,
) {
	if (tableNames.length === 0) {
		return [];
	}

	return await kysely
		.selectFrom("pg_constraint as con")
		.fullJoin("pg_class as tbl", (join) =>
			join.onRef("tbl.oid", "=", "con.conrelid"),
		)
		.fullJoin("pg_namespace as ns", (join) =>
			join.onRef("ns.oid", "=", "tbl.relnamespace"),
		)
		.fullJoin("pg_attribute as col", (join) =>
			join
				.onRef("col.attrelid", "=", "tbl.oid")
				.on("col.attnum", "=", sql`ANY(con.conkey)`),
		)
		.fullJoin("pg_class as ref_tbl", (join) =>
			join.onRef("con.confrelid", "=", "ref_tbl.oid"),
		)
		.fullJoin("pg_namespace as ref_tbl_ns", (join) =>
			join.onRef("ref_tbl_ns.oid", "=", "ref_tbl.relnamespace"),
		)
		.fullJoin("pg_attribute as relcol", (join) =>
			join
				.onRef("relcol.attrelid", "=", "ref_tbl.oid")
				.on("relcol.attnum", "=", sql`ANY(con.conkey)`),
		)
		.fullJoin("information_schema.referential_constraints as rc", (join) =>
			join.onRef("rc.constraint_name", "=", "con.conname"),
		)
		.fullJoin("information_schema.constraint_column_usage as cu", (join) =>
			join.onRef("cu.constraint_name", "=", "con.conname"),
		)
		.select([
			"con.conname",
			sql<"FOREIGN KEY">`'FOREIGN KEY'`.as("constraintType"),
			sql<string>`tbl.relname`.as("table"),
			sql<string[]>`JSON_AGG(DISTINCT col.attname)`.as("columns"),
			sql<string>`CONCAT(ref_tbl_ns.nspname, '.', ref_tbl.relname)`.as(
				"targetTable",
			),
			sql<string[]>`JSON_AGG(DISTINCT cu.column_name)`.as("targetColumns"),
			sql<ForeignKeyRule>`rc.delete_rule`.as("deleteRule"),
			sql<ForeignKeyRule>`rc.update_rule`.as("updateRule"),
			sql<string>`ns.nspname`.as("schemaName"),
		])
		.where("con.contype", "=", "f")
		.where("ns.nspname", "=", databaseSchema)
		.where("con.conname", "~", builderContext.external ? "" : "monolayer_fk$")
		.where("tbl.relname", "in", tableNames)
		.groupBy([
			"tbl.relname",
			"ref_tbl.relname",
			"ref_tbl_ns.nspname",
			"rc.delete_rule",
			"rc.update_rule",
			"con.confrelid",
			"con.conname",
			"ns.nspname",
		])
		.execute();
}

export function localForeignKeyConstraintInfoWithPreviousHash(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
	tablesToRename: TablesToRename,
	columnsToRename: ColumnsToRename,
	allSchemas: AnySchema[],
) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).reduce(
		(acc, [tableName, tableDefinition]) => {
			const tableNameInDatabase = toSnakeCase(tableName, camelCase);
			const introspect = tableInfo(tableDefinition).introspect(allSchemas);
			const foreignKeys = introspect.foreignKeys;
			const schemaName = Schema.info(schema).name;
			if (foreignKeys !== undefined) {
				for (const foreignKey of foreignKeys) {
					const tableKey = currentTableName(
						tableNameInDatabase,
						tablesToRename,
						schemaName,
					);
					const builder = new ForeignKeyBuilder(tableKey, foreignKey, {
						camelCase,
						tablesToRename,
						columnsToRename,
						schemaName,
						external: false,
					});
					const hash = builder.hash("previous");
					acc[tableKey] = {
						...acc[tableKey],
						...{
							[`${hash}`]: builder.build("current"),
						},
					};
				}
			}
			return acc;
		},
		{} as Record<string, Record<string, string>>,
	);
}

export function localForeignKeys(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
	tablesToRename: TablesToRename,
	columnsToRename: ColumnsToRename,
	allSchemas: AnySchema[],
) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).reduce(
		(acc, [tableName, tableDefinition]) => {
			const tableNameInDatabase = toSnakeCase(tableName, camelCase);
			const introspect = tableInfo(tableDefinition).introspect(allSchemas);
			const foreignKeys = introspect.foreignKeys;
			const schemaName = Schema.info(schema).name;
			if (foreignKeys !== undefined) {
				for (const foreignKey of foreignKeys) {
					const tableKey = currentTableName(
						tableNameInDatabase,
						tablesToRename,
						schemaName,
					);
					const builder = new ForeignKeyBuilder(
						tableNameInDatabase,
						foreignKey,
						{
							camelCase,
							tablesToRename,
							columnsToRename,
							schemaName,
							external: false,
						},
					);
					acc[tableKey] = {
						...acc[tableKey],
						...{
							[`${builder.hash("previous")}`]: foreignKey,
						},
					};
				}
			}
			return acc;
		},
		{} as Record<string, Record<string, ForeignKeyIntrospection>>,
	);
}

export function remoteForeignKeys(schema: AnySchema, allSchemas: AnySchema[]) {
	const schemaInfo = Schema.info(schema);
	const tables = schemaInfo.tables;
	return Object.entries(tables || {}).reduce(
		(acc, [tableName, tableDefinition]) => {
			const introspect = tableInfo(tableDefinition).introspect(allSchemas);
			const foreignKeys = introspect.foreignKeys;
			if (foreignKeys !== undefined) {
				for (const foreignKey of foreignKeys) {
					const builder = new ForeignKeyBuilder(tableName, foreignKey, {
						camelCase: { enabled: false },
						tablesToRename: [],
						columnsToRename: {},
						schemaName: schemaInfo.name,
						external: false,
					});
					acc[tableName] = {
						...acc[tableName],
						...{
							[`${builder.hash("previous")}`]: foreignKey,
						},
					};
				}
			}
			return acc;
		},
		{} as Record<string, Record<string, ForeignKeyIntrospection>>,
	);
}
