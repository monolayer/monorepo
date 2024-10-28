import type { ColumnsToRename } from "~pg/introspection/schema.js";
/* eslint-disable max-lines */
import { hashValue } from "@monorepo/utils/hash-value.js";
import { Kysely, sql } from "kysely";
import { toSnakeCase } from "~pg/helpers/to-snake-case.js";
import type { InformationSchemaDB } from "~pg/introspection/introspection/types.js";
import { findPrimaryKey } from "~pg/introspection/schema.js";
import { tableInfo } from "~pg/introspection/table.js";
import type { TableColumn } from "~pg/schema/column.js";
import type {
	ColumnInfo,
	SchemaMigrationInfo,
	TableInfo,
} from "~pg/schema/column/types.js";
import { type AnySchema, Schema } from "~pg/schema/schema.js";

export async function dbColumnInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	const results = await fetchDbColumnInfo(kysely, databaseSchema, tableNames);
	const transformed = transformDbColumnInfo(results);
	const mapped = mapColumnsToTables(transformed);
	for (const table of tableNames) {
		if (mapped[table] === undefined) {
			mapped[table] = {
				columns: {},
				name: table,
			};
		}
	}
	return mapped;
}

export async function fetchDbColumnInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return [];
	}

	return kysely
		.selectFrom("information_schema.columns")
		.fullJoin("pg_class", (eb) =>
			eb.onRef(
				"information_schema.columns.table_name",
				"=",
				"pg_class.relname",
			),
		)
		.fullJoin("pg_namespace", (eb) =>
			eb
				.onRef(
					"information_schema.columns.table_schema",
					"=",
					"pg_namespace.nspname",
				)
				.onRef("pg_class.relnamespace", "=", "pg_namespace.oid"),
		)
		.fullJoin("pg_attribute", (eb) =>
			eb
				.onRef("pg_attribute.attrelid", "=", "pg_class.oid")
				.onRef(
					"pg_attribute.attname",
					"=",
					"information_schema.columns.column_name",
				),
		)
		.fullJoin("pg_type", (eb) =>
			eb.onRef("pg_type.oid", "=", "pg_attribute.atttypid"),
		)
		.select([
			"information_schema.columns.table_name",
			"information_schema.columns.column_name",
			"information_schema.columns.column_default",
			"information_schema.columns.numeric_precision",
			"information_schema.columns.numeric_scale",
			"information_schema.columns.character_maximum_length",
			"information_schema.columns.datetime_precision",
			"information_schema.columns.udt_name",
			sql<
				string | null
			>`(SELECT obj_description(('${sql.raw(databaseSchema)}.' || '"' || "information_schema"."columns"."table_name" || '"')::regclass, 'pg_class')::json->>'previousName')`.as(
				"rename_from",
			),
			"information_schema.columns.identity_generation",
			"information_schema.columns.is_identity",
			sql`pg_get_serial_sequence('${sql.raw(databaseSchema)}.' || '"' || information_schema.columns.table_name || '"', information_schema.columns.column_name)`.as(
				"sequence_name",
			),
			"pg_attribute.atttypmod",
			sql`col_description(pg_attribute.attrelid, pg_attribute.attnum)`.as(
				"column_comment",
			),
			sql<string>`pg_catalog.format_type(pg_type.oid,pg_attribute.atttypmod)`.as(
				"display_name",
			),
		])
		.select((eb) => [
			eb
				.case()
				.when(
					sql`
							pg_get_serial_sequence('${sql.raw(databaseSchema)}.' || '"' || information_schema.columns.table_name || '"', information_schema.columns.column_name) IS NOT NULL
							AND information_schema.columns.data_type = 'integer'
							AND information_schema.columns.is_identity = 'NO'`,
				)
				.then("serial")
				.when(
					sql`
						pg_get_serial_sequence('${sql.raw(databaseSchema)}.' || '"' || information_schema.columns.table_name || '"', information_schema.columns.column_name) IS NOT NULL
						AND information_schema.columns.data_type = 'bigint'
						AND information_schema.columns.is_identity = 'NO'`,
				)
				.then("bigserial")
				.else(sql<string>`information_schema.columns.data_type`)
				.end()
				.as("data_type"),
			eb
				.case()
				.when(sql`information_schema.columns.is_nullable = 'YES'`)
				.then(sql<boolean>`true`)
				.else(sql<boolean>`false`)
				.end()
				.as("is_nullable"),
		])
		.select((eb) => [
			eb
				.case()
				.when(
					sql`
							information_schema.columns.data_type = 'USER-DEFINED' AND pg_type.typtype = 'e'`,
				)
				.then(sql<string>`pg_type.typname`)
				.else(null)
				.end()
				.as("user_defined_type_name"),
		])
		.where("information_schema.columns.table_schema", "=", databaseSchema)
		.where("information_schema.columns.table_name", "in", tableNames)
		.where("pg_attribute.attnum", ">", 0)
		.where("pg_attribute.attisdropped", "=", false)
		.orderBy("information_schema.columns.table_name asc")
		.orderBy("information_schema.columns.column_name asc")
		.execute();
}

// eslint-disable-next-line complexity
export function transformDbColumnInfo(
	info: Awaited<ReturnType<typeof fetchDbColumnInfo>>,
) {
	const transformed: (ColumnInfo & { tableName: string })[] = [];
	for (const row of info) {
		let dataTypeFullName = "";

		let isArray = false;
		if (row.data_type === "ARRAY") {
			row.data_type = nativeToStandardDataType(
				`${row.udt_name}`.replace(/^_/, ""),
			);
			isArray = true;
		}

		switch (row.data_type) {
			case "bigint":
				dataTypeFullName = row.data_type;
				row.numeric_precision = null;
				row.numeric_scale = null;
				break;
			case "bigserial":
			case "serial":
				dataTypeFullName = row.data_type;
				row.numeric_precision = null;
				row.numeric_scale = null;
				break;
			case "double precision":
				row.numeric_precision = null;
				row.numeric_scale = null;
				dataTypeFullName = row.data_type;
				break;
			case "date":
				row.datetime_precision = null;
				dataTypeFullName = row.data_type;
				break;
			case "integer":
				row.numeric_precision = null;
				row.numeric_scale = null;
				dataTypeFullName = row.data_type;
				if (
					row.column_default?.startsWith(
						`nextval('${row.table_name}_${row.column_name}_seq'`,
					)
				) {
					dataTypeFullName = "serial";
					row.column_default = null;
				}
				break;
			case "real":
				dataTypeFullName = row.data_type;
				row.numeric_precision = null;
				row.numeric_scale = null;
				break;
			case "smallint":
				dataTypeFullName = row.data_type;
				row.numeric_precision = null;
				row.numeric_scale = null;
				break;
			case "numeric":
				if (row.numeric_precision !== null && row.numeric_scale !== null) {
					dataTypeFullName = `${row.data_type}(${row.numeric_precision}, ${row.numeric_scale})`;
				} else {
					const match = row.display_name.match(/(\d+),(\d+)\)/);
					if (match !== null) {
						dataTypeFullName = `${row.data_type}(${match[1]},${match[2]})`;
						break;
					}
					dataTypeFullName = row.data_type;
				}
				break;
			case "timestamp without time zone":
			case "time without time zone":
				{
					const base = row.data_type.match(/(\w+).+(with(\w+)?)/)![1];
					if (row.datetime_precision !== null) {
						dataTypeFullName =
							row.atttypmod === -1
								? `${base}`
								: `${base}(${row.datetime_precision})`;
						row.datetime_precision =
							row.atttypmod === -1 ? null : row.datetime_precision;
					} else {
						const match = row.display_name.match(/(\d+)/);
						if (match !== null) {
							row.datetime_precision = parseInt(match[1]!);
							dataTypeFullName = `${base}(${match[1]})`;
							break;
						}
						dataTypeFullName = `${base}`;
					}
				}
				break;
			case "timestamp with time zone":
			case "time with time zone": {
				const base = row.data_type.match(/(\w+).+(with(\w+)?)/)![1];
				if (row.datetime_precision !== null) {
					dataTypeFullName =
						row.atttypmod === -1
							? `${base} with time zone`
							: `${base}(${row.datetime_precision}) with time zone`;
					row.datetime_precision =
						row.atttypmod === -1 ? null : row.datetime_precision;
				} else {
					const match = row.display_name.match(/(\d+)/);
					if (match !== null) {
						row.datetime_precision = parseInt(match[1]!);
						dataTypeFullName = `${base}(${match[1]}) with time zone`;
						break;
					}
					if (row.display_name === `${base} with time zone[]`) {
						dataTypeFullName = `${base} with time zone`;
						break;
					}
				}
				break;
			}
			case "bit varying":
			case "bit":
			case "character":
			case "character varying":
				dataTypeFullName = [
					row.data_type,
					row.atttypmod !== -1
						? `(${row.display_name.match(/(\d+)/)![1]})`
						: undefined,
				]
					.filter((x) => x !== undefined)
					.join("");
				break;
			default:
				dataTypeFullName = row.data_type || "";
				break;
		}

		if (isArray) {
			dataTypeFullName = `${dataTypeFullName}[]`;
		}

		const columnDefault =
			row.sequence_name === null
				? row.column_default !== null
					? `${row.column_comment !== null ? row.column_comment : hashValue(row.column_default)}:${row.column_default}`
					: null
				: null;

		transformed.push({
			tableName: row.table_name!,
			columnName: row.column_name,
			dataType:
				row.user_defined_type_name !== null
					? row.user_defined_type_name
					: dataTypeFullName,
			defaultValue: columnDefault,
			isNullable: row.is_nullable,
			numericPrecision: row.numeric_precision,
			numericScale: row.numeric_scale,
			characterMaximumLength: row.character_maximum_length,
			datetimePrecision: row.datetime_precision,
			identity:
				row.is_identity === "YES" && row.identity_generation !== null
					? row.identity_generation
					: null,
			enum: row.user_defined_type_name !== null,
			volatileDefault: "unknown",
		});
	}
	return transformed;
}

export function mapColumnsToTables(
	columns: (ColumnInfo & { tableName: string })[],
) {
	return columns.reduce<Record<string, TableInfo>>((acc, curr) => {
		if (curr.tableName !== null && curr.columnName !== null) {
			const currentTable = acc[curr.tableName];
			const tableName = curr.tableName;

			const columnWithoutName: ColumnInfo = {
				columnName: curr.columnName,
				dataType: curr.dataType,
				defaultValue: curr.defaultValue,
				isNullable: curr.isNullable,
				numericPrecision: curr.numericPrecision,
				numericScale: curr.numericScale,
				characterMaximumLength: curr.characterMaximumLength,
				datetimePrecision: curr.datetimePrecision,
				identity: curr.identity,
				enum: curr.enum,
				volatileDefault: curr.volatileDefault,
			};
			if (currentTable === undefined) {
				acc[curr.tableName] = {
					name: tableName,
					columns: {
						[curr.columnName as string]: columnWithoutName,
					},
				};
			} else {
				acc[curr.tableName] = {
					name: curr.tableName,
					columns: {
						...currentTable.columns,
						[curr.columnName as string]: columnWithoutName,
					},
				};
			}
		}
		return acc;
	}, {});
}

export function localColumnInfoByTable(
	schema: AnySchema,
	remoteSchema: SchemaMigrationInfo,
	camelCase: boolean = false,
) {
	const tables = Schema.info(schema).tables ?? {};
	return Object.entries(tables).reduce<Record<string, TableInfo>>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const columns = Object.entries(
				tableInfo(tableDefinition).definition.columns,
			);
			acc[transformedTableName] = columns.reduce<TableInfo>(
				(columnAcc, [columnName, column]) => {
					const columnInfo = schemaColumnInfo(
						columnName,
						column as TableColumn,
					);
					let columnKey = columnName;
					const transformedColumnName = toSnakeCase(columnName, camelCase);
					columnInfo.columnName = transformedColumnName;
					columnKey = transformedColumnName;
					const pKey = findPrimaryKey(
						transformedTableName,
						remoteSchema.primaryKey,
					);
					const remoteColumn =
						remoteSchema.table[transformedTableName]?.columns[
							transformedColumnName
						];
					const remoteColumnName =
						remoteSchema.table[transformedTableName]?.columns[
							transformedColumnName
						]?.columnName;
					const isRenamedColumn =
						remoteColumnName !== undefined &&
						remoteColumnName !== null &&
						columnInfo.columnName !== remoteColumnName;
					if (isRenamedColumn) {
						if (pKey?.includes(remoteColumnName)) {
							columnInfo.originalIsNullable = remoteColumn?.isNullable;
							columnInfo.isNullable = false;
						}
					} else {
						if (pKey?.includes(transformedColumnName)) {
							columnInfo.originalIsNullable = columnInfo.isNullable;
							columnInfo.isNullable = false;
						}
					}
					columnAcc.columns[columnKey] = columnInfo;
					return columnAcc;
				},
				{ columns: {}, name: transformedTableName },
			);
			return acc;
		},
		{},
	);
}

export function schemaColumnInfo(
	columnName: string,
	column: TableColumn,
): ColumnInfo {
	const columnInfo: ColumnInfo = Object.fromEntries(
		Object.entries(column),
	).info;
	const meta = columnInfo;
	return {
		columnName: columnName,
		dataType: meta.dataType,
		characterMaximumLength: meta.characterMaximumLength,
		datetimePrecision: meta.datetimePrecision,
		isNullable: meta.isNullable,
		numericPrecision: meta.numericPrecision,
		numericScale: meta.numericScale,
		defaultValue: meta.defaultValue !== null ? meta.defaultValue : null,
		identity: meta.identity,
		enum: meta.enum,
		volatileDefault: meta.volatileDefault,
	};
}

function nativeToStandardDataType(dataType: string) {
	switch (dataType) {
		case "bit":
			return "bit";
		case "bool":
			return "boolean";
		case "bpchar":
			return "character";
		case "int2":
			return "smallint";
		case "int4":
			return "integer";
		case "int8":
			return "bigint";
		case "float4":
			return "real";
		case "float8":
			return "double precision";
		case "time":
			return "time without time zone";
		case "timestamp":
			return "timestamp without time zone";
		case "timetz":
			return "time with time zone";
		case "timestamptz":
			return "timestamp with time zone";
		case "numeric":
			return "numeric";
		case "varbit":
			return "bit varying";
		case "varchar":
			return "character varying";
		default:
			return dataType;
	}
}

export function changedColumnNames(
	table: string,
	schemaName: string,
	columnsToRename: ColumnsToRename,
) {
	return columnsToRename[`${schemaName}.${table}`] ?? [];
}

export function previousColumnName(
	tableName: string,
	schemaName: string,
	changedColumName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, schemaName, columnsToRename).find(
			(column) => {
				return column.to === changedColumName;
			},
		)?.from || changedColumName
	);
}

export function currentColumName(
	tableName: string,
	schemaName: string,
	previousColumName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, schemaName, columnsToRename).find(
			(column) => {
				return column.from === previousColumName;
			},
		)?.to || previousColumName
	);
}
