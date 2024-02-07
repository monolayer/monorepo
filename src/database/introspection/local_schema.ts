import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { TableSchema, pgTable } from "~/database/schema/pg_table.js";
import { type ColumnInfo, PgColumnTypes } from "../schema/pg_column.js";
import { PgForeignKeyConstraint } from "../schema/pg_foreign_key.js";
import { indexMeta, pgIndex } from "../schema/pg_index.js";
import { PgUniqueConstraint } from "../schema/pg_unique.js";
import {
	foreignKeyConstraintInfoToQuery,
	uniqueConstraintInfoToQuery,
} from "./info_to_query.js";
import { ColumnsInfo, IndexInfo, TableColumnInfo } from "./types.js";

export function schemaTableInfo(tables: pgTable<string, TableSchema>[]) {
	return tables.map((table) => ({
		tableName: table.name,
		schemaName: "public",
	}));
}

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
	schema: pgDatabase<Record<string, pgTable<string, TableSchema>>>,
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
	schema: pgDatabase<Record<string, pgTable<string, TableSchema>>>,
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	return Object.entries(schema.tables).reduce<IndexInfo>(
		(acc, [tableName, tableDefinition]) => {
			const indexes = tableDefinition.indexes;
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function indexToInfo(index: pgIndex, tableName: string, kysely: Kysely<any>) {
	const meta = indexMeta(index as pgIndex);

	const compiledQuery = meta
		.builder(kysely.schema.createIndex(meta.name).on(tableName))
		.compile().sql;

	return {
		[index.name]: compiledQuery,
	};
}

export type ConstraintInfo = {
	unique: Record<string, string>;
	foreignKey: Record<string, string>;
};

export function schemaDbConstraintInfoByTable(
	schema: pgDatabase<Record<string, pgTable<string, TableSchema>>>,
) {
	return Object.entries(schema.tables).reduce<ConstraintInfo>(
		(acc, [tableName, tableDefinition]) => {
			for (const constraint of tableDefinition.constraints) {
				if (constraint instanceof PgUniqueConstraint) {
					const constraintInfo = uniqueConstraintInfoToQuery({
						constraintType: "UNIQUE",
						table: tableName,
						columns: constraint.columns,
						nullsDistinct: constraint.nullsDistinct,
					});
					const keyName = `${tableName}_${constraint.columns.join(
						"_",
					)}_kinetic_key`;
					acc.unique = {
						...acc.unique,
						[keyName]: constraintInfo,
					};
				}
				if (constraint instanceof PgForeignKeyConstraint) {
					const constraintInfo = foreignKeyConstraintInfoToQuery({
						constraintType: "FOREIGN KEY",
						table: tableName,
						column: constraint.columns,
						targetTable: constraint.targetTable,
						targetColumns: constraint.targetColumns,
						deleteRule: constraint.options.deleteRule,
						updateRule: constraint.options.updateRule,
					});
					const keyName = `${tableName}_${constraint.columns.join("_")}_${
						constraint.targetTable
					}_${constraint.targetColumns.join("_")}_kinetic_fk`;
					acc.foreignKey = {
						...acc.foreignKey,
						[keyName]: constraintInfo,
					};
				}
			}
			return acc;
		},
		{ unique: {}, foreignKey: {} },
	);
}
