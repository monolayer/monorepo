import { type CreateIndexBuilder, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { type PgTable } from "~/database/schema/pg_table.js";
import type {
	ConstraintInfo,
	MigrationSchema,
} from "../migrations/migration_schema.js";
import { type ColumnInfo, PgColumnTypes } from "../schema/pg_column.js";
import { PgForeignKey } from "../schema/pg_foreign_key.js";
import type { PgIndex } from "../schema/pg_index.js";
import { PgPrimaryKey } from "../schema/pg_primary_key.js";
import { PgUnique } from "../schema/pg_unique.js";
import {
	foreignKeyConstraintInfoToQuery,
	primaryKeyConstraintInfoToQuery,
	uniqueConstraintInfoToQuery,
} from "./info_to_query.js";
import { ColumnsInfo, IndexInfo, TableColumnInfo } from "./types.js";

export function schemaColumnInfo(
	tableName: string,
	columnName: string,
	column: PgColumnTypes,
): ColumnInfo {
	const columnInfo: ColumnInfo = Object.fromEntries(
		Object.entries(column),
	).info;
	const meta = columnInfo;
	return {
		tableName: tableName,
		columnName: columnName,
		dataType: meta.dataType,
		characterMaximumLength: meta.characterMaximumLength,
		datetimePrecision: meta.datetimePrecision,
		isNullable: meta.isNullable,
		numericPrecision: meta.numericPrecision,
		numericScale: meta.numericScale,
		renameFrom: meta.renameFrom,
		primaryKey: meta.primaryKey,
		defaultValue: meta.defaultValue ? meta.defaultValue.toString() : null,
		foreignKeyConstraint: meta.foreignKeyConstraint,
		identity: meta.identity,
		unique: meta.unique,
	};
}

export function schemaDBColumnInfoByTable(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema: pgDatabase<Record<string, PgTable<string, any>>>,
) {
	return Object.entries(schema.tables).reduce<TableColumnInfo>(
		(acc, [tableName, tableDefinition]) => {
			const columns = Object.entries(tableDefinition.columns);
			acc[tableName] = columns.reduce<ColumnsInfo>(
				(columnAcc, [columnName, column]) => {
					columnAcc[columnName] = schemaColumnInfo(
						tableName,
						columnName,
						column as PgColumnTypes,
					);
					return columnAcc;
				},
				{},
			);
			return acc;
		},
		{},
	);
}

export function schemaDBIndexInfoByTable(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema: pgDatabase<Record<string, PgTable<string, any>>>,
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	return Object.entries(schema.tables).reduce<IndexInfo>(
		(acc, [tableName, tableDefinition]) => {
			const indexes = tableDefinition.indexes || [];
			for (const index of indexes) {
				const indexInfo = indexToInfo(index, tableName, kysely);
				acc[tableName] = {
					...acc[tableName],
					...indexInfo,
				};
			}
			return acc;
		},
		{},
	);
}

function indexToInfo(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	index: PgIndex<any>,
	tableName: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	kysely: Kysely<any>,
) {
	const indexName = `${tableName}_${index.columns.join("_")}_kntc_idx`;
	const kyselyBuilder = kysely.schema
		.createIndex(indexName)
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.on(tableName) as CreateIndexBuilder<any> & {
		column: never;
		columns: never;
	};
	const compiledQuery = index._builder(kyselyBuilder).compile().sql;

	return {
		[indexName]: compiledQuery,
	};
}

export function schemaDbConstraintInfoByTable(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema: pgDatabase<Record<string, PgTable<string, any>>>,
) {
	return Object.entries(schema.tables).reduce<ConstraintInfo>(
		(acc, [tableName, tableDefinition]) => {
			for (const constraint of tableDefinition.constraints || []) {
				if (constraint instanceof PgUnique) {
					const keyName = `${tableName}_${constraint.columns.join(
						"_",
					)}_kinetic_key`;
					const constraintInfo = {
						[keyName]: uniqueConstraintInfoToQuery({
							constraintType: "UNIQUE",
							table: tableName,
							columns: constraint.columns,
							nullsDistinct: constraint.nullsDistinct,
						}),
					};
					acc.unique[tableName] = {
						...acc.unique[tableName],
						...constraintInfo,
					};
				}
				if (constraint instanceof PgForeignKey) {
					const keyName = `${tableName}_${constraint.columns.join("_")}_${
						constraint.targetTable.name
					}_${constraint.targetColumns.join("_")}_kinetic_fk`;
					const constraintInfo = {
						[keyName]: foreignKeyConstraintInfoToQuery({
							constraintType: "FOREIGN KEY",
							table: tableName,
							column: constraint.columns,
							targetTable: constraint.targetTable.name,
							targetColumns: constraint.targetColumns,
							deleteRule: constraint.options.deleteRule,
							updateRule: constraint.options.updateRule,
						}),
					};
					acc.foreign[tableName] = {
						...acc.foreign[tableName],
						...constraintInfo,
					};
				}
				if (constraint instanceof PgPrimaryKey) {
					const keyName = `${tableName}_${constraint.columns.join(
						"_",
					)}_kinetic_pk`;
					const constraintInfo = {
						[keyName]: primaryKeyConstraintInfoToQuery({
							constraintType: "PRIMARY KEY",
							table: tableName,
							columns: constraint.columns,
						}),
					};

					acc.primaryKey[tableName] = {
						...acc.primaryKey[tableName],
						...constraintInfo,
					};
				}
			}
			return acc;
		},
		{ unique: {}, foreign: {}, primaryKey: {} },
	);
}

export function localSchema(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema: pgDatabase<Record<string, PgTable<string, any>>>,
): MigrationSchema {
	const constraints = schemaDbConstraintInfoByTable(schema);
	return {
		table: schemaDBColumnInfoByTable(schema),
		index: schemaDBIndexInfoByTable(schema),
		foreignKeyConstraints: {
			...constraints.foreign,
		},
		uniqueConstraints: {
			...constraints.unique,
		},
		primaryKey: {
			...constraints.primaryKey,
		},
	};
}
