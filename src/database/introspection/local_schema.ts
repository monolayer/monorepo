import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { TableSchema, pgTable } from "~/database/schema/table.js";
import { type ColumnInfo, PgColumnTypes } from "../schema/pg_column.js";
import { indexMeta, pgIndex } from "../schema/pg_index.js";
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
	};
}

export function schemaDBColumnInfoByTable(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema: pgDatabase<Record<string, pgTable<string, any>>>,
) {
	return Object.entries(schema.tables || []).reduce<TableColumnInfo>(
		(acc, [tableName, tableDefinition]) => {
			const columns = Object.entries(tableDefinition.columns || []);
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
	schema: pgDatabase<Record<string, pgTable<string, any>>>,
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	return Object.entries(schema.tables || []).reduce<IndexInfo>(
		(acc, [tableName, tableDefinition]) => {
			const indexes = tableDefinition.indexes as pgIndex[] | undefined;
			for (const index of indexes || []) {
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
