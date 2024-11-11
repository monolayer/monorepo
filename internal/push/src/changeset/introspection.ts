import { ForeignKeyBuilder } from "@monorepo/pg/introspection/introspection/foreign-key-builder.js";
import { findColumnByNameInTable } from "@monorepo/pg/introspection/schema.js";
import { gen } from "effect/Effect";
import { CamelCasePlugin, type Kysely } from "kysely";
import {
	ChangesetGeneratorState,
	type ChangesetGenerator,
} from "../state/changeset-generator.js";
import type {
	ColumnInfo,
	LocalTableInfo,
	SchemaMigrationInfo,
} from "./types/schema.js";

class CamelCase extends CamelCasePlugin {
	toSnakeCase(str: string): string {
		return this.snakeCase(str);
	}
}

export function toSnakeCase(str: string, camelCase: boolean) {
	if (camelCase) {
		return new CamelCase().toSnakeCase(str);
	}
	return str;
}

export type ColumnExists =
	| {
			exists: true;
			nullable: boolean;
	  }
	| {
			exists: false;
	  };

export function columnInDb(
	tableName: string,
	column: string,
	db: SchemaMigrationInfo,
): ColumnExists {
	const table = db.table[tableName];
	if (table !== undefined) {
		const tableColumn =
			table.columns[column] || findColumnByNameInTable(table, column);
		if (tableColumn !== undefined) {
			return {
				exists: true,
				nullable: tableColumn.isNullable,
			};
		}
	}
	return {
		exists: false,
	};
}

export function columnInTable(
	tableName: string,
	column: string,
	local: LocalTableInfo,
): ColumnExists {
	const table = local.table[tableName];
	if (table !== undefined) {
		const tableColumn =
			table.columns[column] || findColumnByNameInTable(table, column);
		if (tableColumn !== undefined) {
			return {
				exists: true,
				nullable: tableColumn.isNullable,
			};
		}
	}
	return {
		exists: false,
	};
}

export function existingColumns(options: {
	columns: string[];
	table: string;
	local: LocalTableInfo;
	db: SchemaMigrationInfo;
}) {
	const { columns, table, local, db } = options;
	const existingColumns = columns.filter((column) => {
		const localColumn = columnInTable(table, column, local);
		const dbColumn = columnInDb(table, column, db);
		return localColumn.exists === true && dbColumn.exists === true;
	});
	return existingColumns;
}

export function includedInRecord(
	values: string[],
	record: Record<string, string[]>,
	key: string,
) {
	return values
		.reduce((acc, col) => {
			if (record[key] !== undefined && record[key].includes(col)) {
				acc.push(true);
			} else {
				acc.push(false);
			}
			return acc;
		}, [] as boolean[])
		.every((col) => col === true);
}

export function tableStructureHasChanged(
	tableName: string,
	context: ChangesetGenerator,
) {
	const tableNameChanged =
		resolveCurrentTableName(tableName, context) !==
		resolvePreviousTableName(tableName, context);
	return (
		tableNameChanged ||
		context.columnsToRename[`${context.schemaName}.${tableName}`] !== undefined
	);
}

export function resolveTableName(
	tableName: string,
	mode: "current" | "previous",
) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		switch (mode) {
			case "current":
				return (
					context.tablesToRename
						.find((table) => {
							return table.from === `${context.schemaName}.${tableName}`;
						})
						?.to.split(".")[1] ?? tableName
				);
			case "previous":
				return (
					context.tablesToRename
						.find((table) => {
							return table.to === `${context.schemaName}.${tableName}`;
						})
						?.from.split(".")[1] ?? tableName
				);
		}
	});
}

export function resolveCurrentTableName(
	previousTableName: string,
	context: ChangesetGenerator,
) {
	const currentName = context.tablesToRename.find((table) => {
		return table.from === `${context.schemaName}.${previousTableName}`;
	})?.to;

	return currentName === undefined
		? previousTableName
		: currentName.split(".")[1]!;
}

export function resolvePreviousTableName(
	changedTableName: string,
	context: ChangesetGenerator,
) {
	const previousName = context.tablesToRename.find((table) => {
		return table.to === `${context.schemaName}.${changedTableName}`;
	})?.from;

	return previousName === undefined
		? changedTableName
		: previousName.split(".")[1]!;
}

export function foreignKeyDefinition(
	tableName: string,
	hash: string,
	schema: SchemaMigrationInfo,
	mode: "current" | "previous",
	{
		columnsToRename,
		tablesToRename,
		camelCase,
		schemaName,
	}: Pick<
		ChangesetGenerator,
		"tablesToRename" | "columnsToRename" | "camelCase" | "schemaName"
	>,
) {
	const localDef = fetchForeignKeyDefinition(tableName, hash, schema);
	const localBuilder = new ForeignKeyBuilder(tableName, localDef, {
		tablesToRename,
		columnsToRename,
		camelCase,
		schemaName: schemaName,
		external: false,
	});
	return localBuilder.definition(mode);
}

export function fetchForeignKeyDefinition(
	tableName: string,
	hash: string,
	local: SchemaMigrationInfo,
) {
	const fks = local.foreignKeyDefinitions || {};
	const tableForeignKeyDefinition = fks[tableName] || {};
	return tableForeignKeyDefinition[hash]!;
}

interface PrimaryKeyColumnDetails {
	columnName: string;
	inDb: ColumnExists;
	inTable: ColumnExists;
	new: boolean;
	existingNullable: boolean;
}

export function primaryKeyColumnDetails(
	table: string,
	columns: string[],
	context: ChangesetGenerator,
) {
	return columns.reduce<Record<string, PrimaryKeyColumnDetails>>((acc, col) => {
		const inDb = columnInDb(table, col, context.db);
		const inTable = columnInTable(table, col, context.local);
		acc[col] = {
			columnName: col,
			inDb,
			inTable,
			existingNullable: inDb.exists && inDb.nullable,
			new: !inDb.exists && inTable.exists,
		};
		return acc;
	}, {});
}

export function uniqueConstraintDefinitionFromString(
	unique: string,
	tableName: string,
	hashValue: string,
) {
	const [, columns] = unique.split("DISTINCT (");

	const definition = {
		name: `${tableName}_${hashValue}_monolayer_key`,
		distinct: unique.includes("UNIQUE NULLS DISTINCT"),
		columns: columns?.replace(/"/g, "").split(")")[0]?.split(", ") || [],
	};
	return definition;
}

export type ColumnsInfoDiff = Record<string, ColumnInfoDiff>;
export type ColumnInfoDiff = Omit<ColumnInfo, "defaultValue"> & {
	defaultValue: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyKysely = Kysely<any>;
