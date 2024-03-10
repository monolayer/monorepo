import { createHash } from "crypto";
import {
	Kysely,
	PostgresDialect,
	isExpression,
	type Expression,
	type RawBuilder,
} from "kysely";
import pg from "pg";
import type { CamelCaseOptions } from "~/config.js";
import { type AnyPgDatabase } from "~/database/schema/pg_database.js";
import { toSnakeCase } from "../migration_op/helpers.js";
import {
	findColumn,
	findPrimaryKey,
	findTableByNameInDatabaseSchema,
	primaryKeyColumns,
	type ForeignKeyInfo,
	type MigrationSchema,
	type PrimaryKeyInfo,
	type TriggerInfo,
	type UniqueInfo,
} from "../migrations/migration_schema.js";
import { PgColumnTypes, PgEnum, type ColumnInfo } from "../schema/pg_column.js";
import type { PgIndex } from "../schema/pg_index.js";
import type { ColumnRecord } from "../schema/pg_table.js";
import type { PgTrigger } from "../schema/pg_trigger.js";
import type { PgUnique } from "../schema/pg_unique.js";
import {
	foreignKeyConstraintInfoToQuery,
	primaryKeyConstraintInfoToQuery,
} from "./info_to_query.js";
import {
	ColumnsInfo,
	IndexInfo,
	TableColumnInfo,
	type EnumInfo,
	type ExtensionInfo,
} from "./types.js";

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
		defaultValue: meta.defaultValue
			? isExpression(meta.defaultValue)
				? compileDefaultExpression(meta.defaultValue)
				: meta.defaultValue.toString()
			: null,
		identity: meta.identity,
		enum: meta.enum,
	};
}

export function compileDefaultExpression(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expression: Expression<any>,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const compiled = (expression as RawBuilder<any>).compile(kysely);
	return substituteSQLParameters({
		sql: compiled.sql,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		parameters: compiled.parameters as any[],
	});
}

function substituteSQLParameters(queryObject: {
	sql: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parameters: any[];
}) {
	let { sql } = queryObject;
	const { parameters } = queryObject;
	// Replace each placeholder with the corresponding parameter from the array
	parameters.forEach((param, idx) => {
		// Create a regular expression for each placeholder (e.g., $1, $2)
		// Note: The backslash is escaped in the string, and '$' is escaped in the regex
		const regex = new RegExp(`\\$${idx + 1}`, "g");
		const value = typeof param === "object" ? JSON.stringify(param) : param;
		sql = sql.replace(regex, value);
	});

	return sql;
}

export function schemaDBColumnInfoByTable(
	schema: AnyPgDatabase,
	remoteSchema: MigrationSchema,
	camelCase: CamelCaseOptions = { enabled: false },
) {
	return Object.entries(schema.tables || {}).reduce<TableColumnInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const columns = Object.entries(tableDefinition.schema.columns);
			acc[transformedTableName] = columns.reduce<ColumnsInfo>(
				(columnAcc, [columnName, column]) => {
					const columnInfo = schemaColumnInfo(
						transformedTableName,
						columnName,
						column as PgColumnTypes,
					);
					let columnKey = columnName;
					const transformedColumnNname = toSnakeCase(columnName, camelCase);
					columnInfo.columnName = transformedColumnNname;
					columnKey = transformedColumnNname;
					const pKey = findPrimaryKey(remoteSchema, transformedTableName);
					if (columnInfo.renameFrom !== null) {
						const appliedInRemote =
							findColumn(remoteSchema, transformedTableName, columnName) !==
							undefined;
						const toApplyInRemote =
							findColumn(
								remoteSchema,
								transformedTableName,
								columnInfo.renameFrom,
							) !== undefined;
						if (appliedInRemote && pKey?.includes(columnName)) {
							columnInfo.originalIsNullable = columnInfo.isNullable;
							columnInfo.isNullable = false;
						}
						if (appliedInRemote || toApplyInRemote) {
							if (toApplyInRemote) {
								columnKey = columnInfo.renameFrom;
								if (pKey?.includes(columnInfo.renameFrom)) {
									columnInfo.originalIsNullable = columnInfo.isNullable;
									columnInfo.isNullable = false;
								}
							}
						}
						columnInfo.renameFrom = null;
					} else {
						if (pKey?.includes(columnName)) {
							columnInfo.originalIsNullable = columnInfo.isNullable;
							columnInfo.isNullable = false;
						}
					}
					columnAcc[columnKey] = columnInfo;
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
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions = { enabled: false },
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	return Object.entries(schema.tables || {}).reduce<IndexInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const indexes = tableDefinition.schema.indexes || [];
			for (const index of indexes) {
				const indexInfo = indexToInfo(
					index,
					transformedTableName,
					kysely,
					camelCase,
				);
				acc[transformedTableName] = {
					...acc[transformedTableName],
					...indexInfo,
				};
			}
			return acc;
		},
		{},
	);
}

export function indexToInfo(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	index: PgIndex<any>,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
) {
	const indexCompileArgs = index.compileArgs();
	const transformedTableName = toSnakeCase(tableName, camelCase);
	const transformedColumnNames = indexCompileArgs.columns.map((column) =>
		toSnakeCase(column, camelCase),
	);
	const indexName = `${transformedTableName}_${transformedColumnNames.join(
		"_",
	)}_kntc_idx`;
	let kyselyBuilder = kysely.schema
		.createIndex(indexName)
		.on(transformedTableName)
		.columns(transformedColumnNames);

	if (indexCompileArgs.ifNotExists) {
		kyselyBuilder = kyselyBuilder.ifNotExists();
	}
	if (indexCompileArgs.unique) {
		kyselyBuilder = kyselyBuilder.unique();
	}
	if (indexCompileArgs.nullsNotDistinct) {
		kyselyBuilder = kyselyBuilder.nullsNotDistinct();
	}
	if (indexCompileArgs.expression !== undefined) {
		kyselyBuilder = kyselyBuilder.expression(indexCompileArgs.expression);
	}
	if (indexCompileArgs.using !== undefined) {
		kyselyBuilder = kyselyBuilder.using(indexCompileArgs.using);
	}
	if (indexCompileArgs.where !== undefined) {
		if (indexCompileArgs.where.length === 1) {
			kyselyBuilder = kyselyBuilder.where(indexCompileArgs.where[0]);
		}
		if (indexCompileArgs.where.length === 3) {
			kyselyBuilder = kyselyBuilder.where(
				indexCompileArgs.where[0],
				indexCompileArgs.where[1],
				indexCompileArgs.where[2],
			);
		}
	}
	const compiledQuery = kyselyBuilder.compile().sql;

	const hash = createHash("sha256");
	hash.update(compiledQuery);
	return {
		[indexName]: `${hash.digest("hex")}:${compiledQuery}`,
	};
}

export function localSchema(
	schema: AnyPgDatabase,
	remoteSchema: MigrationSchema,
	camelCase: CamelCaseOptions = { enabled: false },
): MigrationSchema {
	return {
		extensions: schemaDBExtensionsInfo(schema),
		table: schemaDBColumnInfoByTable(schema, remoteSchema, camelCase),
		index: schemaDBIndexInfoByTable(schema, camelCase),
		foreignKeyConstraints: foreignKeyConstraintInfo(schema, camelCase),
		uniqueConstraints: uniqueConstraintInfo(schema, camelCase),
		primaryKey: primaryKeyConstraintInfo(schema, camelCase),
		triggers: {
			...schemaDBTriggersInfo(schema, camelCase),
		},
		enums: schemaDbEnumInfo(schema),
	};
}

function schemaDBExtensionsInfo(schema: AnyPgDatabase) {
	return schema.extensions.reduce<ExtensionInfo>((acc, curr) => {
		acc[curr] = true;
		return acc;
	}, {});
}

function schemaDBTriggersInfo(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	return Object.entries(schema.tables || {}).reduce<TriggerInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			tableDefinition.schema.triggers;
			for (const trigger of Object.entries(
				tableDefinition.schema.triggers || {},
			)) {
				const triggerName = `${trigger[0]}_trg`.toLowerCase();
				const hash = createHash("sha256");
				const compiledTrigger = triggerInfo(
					trigger[1],
					triggerName,
					transformedTableName,
					kysely,
					camelCase,
				);
				hash.update(compiledTrigger);

				acc[transformedTableName] = {
					...acc[transformedTableName],
					[triggerName]: `${hash.digest("hex")}:${compiledTrigger}`,
				};
			}
			return acc;
		},
		{},
	);
}

export function schemaDbEnumInfo(schema: AnyPgDatabase) {
	return Object.entries(schema.tables || {}).reduce<EnumInfo>(
		(enumInfo, [, tableDefinition]) => {
			const keys = Object.keys(tableDefinition.schema.columns);
			for (const key of keys) {
				const column = tableDefinition.schema.columns[key];
				if (column instanceof PgEnum) {
					const columnDef = Object.fromEntries(Object.entries(column)) as {
						info: ColumnInfo;
						values: string[];
					};
					const enumName = columnDef.info.dataType;
					if (enumName !== null) {
						enumInfo[enumName] = (columnDef.values as string[]).join(", ");
					}
				}
			}
			return enumInfo;
		},
		{},
	);
}

function primaryKeyConstraintInfo(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions,
) {
	return Object.entries(schema.tables || {}).reduce<PrimaryKeyInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const columns = tableDefinition.schema.columns as ColumnRecord;
			const primaryKeys = primaryKeyColumns(columns, camelCase);
			if (primaryKeys.length !== 0) {
				const keyName = `${transformedTableName}_${primaryKeys
					.sort()
					.join("_")}_kinetic_pk`;
				acc[transformedTableName] = {
					[keyName]: primaryKeyConstraintInfoToQuery({
						constraintType: "PRIMARY KEY",
						table: transformedTableName,
						columns: primaryKeys,
					}),
				};
			}
			return acc;
		},
		{},
	);
}

function foreignKeyConstraintInfo(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions,
) {
	return Object.entries(schema.tables || {}).reduce<ForeignKeyInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const introspect = tableDefinition.introspect();
			const foreignKeys = introspect.foreignKeys;
			if (foreignKeys !== undefined) {
				for (const foreignKey of foreignKeys) {
					const targetTableName = findTableByNameInDatabaseSchema(
						foreignKey.targetTable,
						schema,
						camelCase,
					);
					const transformedColumNames = foreignKey.columns.map((column) =>
						toSnakeCase(column, camelCase),
					);

					const transformedtargetColumnNames = foreignKey.targetColumns.map(
						(column) => toSnakeCase(column, camelCase),
					);
					if (targetTableName !== undefined) {
						const keyName = `${transformedTableName}_${transformedColumNames.join(
							"_",
						)}_${targetTableName}_${transformedtargetColumnNames.join(
							"_",
						)}_kinetic_fk`;
						acc[transformedTableName] = {
							...acc[transformedTableName],
							[keyName]: foreignKeyConstraintInfoToQuery({
								constraintType: "FOREIGN KEY",
								table: transformedTableName,
								column: transformedColumNames,
								targetTable: targetTableName,
								targetColumns: transformedtargetColumnNames,
								deleteRule: foreignKey.deleteRule ?? null,
								updateRule: foreignKey.updateRule ?? null,
							}),
						};
					}
				}
			}
			return acc;
		},
		{},
	);
}

function uniqueConstraintInfo(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	return Object.entries(schema.tables || {}).reduce<UniqueInfo>(
		(acc, [tableName, tableDefinition]) => {
			const uniqueConstraints = tableDefinition.schema.uniqueConstraints;
			if (uniqueConstraints !== undefined) {
				for (const uniqueConstraint of uniqueConstraints) {
					const unique = uniqueToInfo(
						uniqueConstraint,
						tableName,
						kysely,
						camelCase,
					);
					acc[tableName] = {
						...acc[tableName],
						...unique,
					};
				}
			}
			return acc;
		},
		{},
	);
}

export function uniqueToInfo(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	unique: PgUnique<any>,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
) {
	const args = unique.compileArgs();
	const newTableName = toSnakeCase(tableName, camelCase);
	const columns = args.cols
		.sort()
		.map((column) => toSnakeCase(column, camelCase));
	const keyName = `${newTableName}_${columns.join("_")}_kinetic_key`;

	const kyselyBuilder = kysely.schema
		.alterTable(newTableName)
		.addUniqueConstraint(keyName, columns, (uc) => {
			if (args.nullsDistinct === false) {
				return uc.nullsNotDistinct();
			}
			return uc;
		});

	let compiledQuery = kyselyBuilder.compile().sql;

	compiledQuery = compiledQuery.replace(
		/alter table "\w+" add constraint /,
		"",
	);
	if (args.nullsDistinct) {
		compiledQuery = compiledQuery.replace("unique", "UNIQUE NULLS DISTINCT");
	} else {
		compiledQuery = compiledQuery.replace(
			"unique nulls not distinct",
			"UNIQUE NULLS NOT DISTINCT",
		);
	}

	return {
		[keyName]: compiledQuery,
	};
}

export function triggerInfo(
	trigger: PgTrigger,
	triggerName: string,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
) {
	const compileArgs = trigger.compileArgs();

	const transformedColumnNames = compileArgs.columns?.map((column) =>
		toSnakeCase(column, camelCase),
	);
	const events = compileArgs.events?.map((event) => {
		if (event === "update of" && transformedColumnNames !== undefined) {
			return `UPDATE OF ${transformedColumnNames.join(", ")}`;
		}
		return event.toUpperCase();
	});

	const execute =
		compileArgs.functionArgs !== undefined
			? `${compileArgs.functionName}(${compileArgs.functionArgs
					.map((arg) => toSnakeCase(arg.value, camelCase))
					.join(", ")})`
			: `${compileArgs.functionName}`;

	return [
		`CREATE OR REPLACE TRIGGER ${triggerName}`,
		`${compileArgs.firingTime?.toUpperCase()} ${events?.join(
			" OR ",
		)} ON ${tableName}`,
		`${
			compileArgs.referencingNewTableAs !== undefined &&
			compileArgs.referencingOldTableAs !== undefined
				? `REFERENCING NEW TABLE AS ${compileArgs.referencingNewTableAs} OLD TABLE AS ${compileArgs.referencingOldTableAs}`
				: compileArgs.referencingNewTableAs !== undefined
					? `REFERENCING NEW TABLE AS ${compileArgs.referencingNewTableAs}`
					: compileArgs.referencingOldTableAs !== undefined
						? `REFERENCING OLD TABLE AS ${compileArgs.referencingOldTableAs}`
						: ""
		}`,
		`FOR EACH ${compileArgs.forEach?.toUpperCase()}`,
		`${
			compileArgs.condition !== undefined
				? `WHEN ${compileArgs.condition.compile(kysely).sql}`
				: ""
		}`,
		`EXECUTE FUNCTION ${execute}`,
	]
		.filter((part) => part !== "")
		.join("\n");
}
