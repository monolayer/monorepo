import { Kysely, type OnModifyForeignAction, sql } from "kysely";
import {
	ActionStatus,
	OperationAnyError,
	OperationSuccess,
} from "~/cli/command.js";
import { ColumnInfo, ColumnUnique } from "../../schema/pg_column.js";
import { TableColumnInfo } from "../types.js";
import type { InformationSchemaDB } from "./types.js";

export async function dbColumnInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<TableColumnInfo> | OperationAnyError> {
	try {
		const results = await fetchDbColumnInfo(kysely, databaseSchema, tableNames);
		const transformed = transformDbColumnInfo(results);
		const mapped = mapColumnsToTables(transformed);
		console.dir(mapped, { depth: null });
		return {
			status: ActionStatus.Success,
			result: mapped,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}

async function fetchDbColumnInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return [];
	}

	return kysely
		.selectFrom("information_schema.columns")
		.fullJoin("information_schema.key_column_usage", (join) =>
			join
				.onRef(
					"information_schema.key_column_usage.table_name",
					"=",
					"information_schema.columns.table_name",
				)
				.onRef(
					"information_schema.key_column_usage.column_name",
					"=",
					"information_schema.columns.column_name",
				),
		)
		.fullJoin("information_schema.constraint_column_usage", (join) =>
			join.onRef(
				"information_schema.constraint_column_usage.constraint_name",
				"=",
				"information_schema.key_column_usage.constraint_name",
			),
		)
		.fullJoin("information_schema.table_constraints", (join) =>
			join.onRef(
				"information_schema.table_constraints.constraint_name",
				"=",
				"information_schema.key_column_usage.constraint_name",
			),
		)
		.fullJoin("information_schema.referential_constraints", (join) =>
			join.onRef(
				"information_schema.table_constraints.constraint_name",
				"=",
				"information_schema.referential_constraints.constraint_name",
			),
		)
		.select([
			"information_schema.columns.table_name",
			"information_schema.columns.column_name",
			"information_schema.columns.column_default",
			"information_schema.columns.numeric_precision",
			"information_schema.columns.numeric_scale",
			"information_schema.columns.character_maximum_length",
			"information_schema.columns.datetime_precision",
			sql<
				string | null
			>`(SELECT obj_description(('public.' || "information_schema"."columns"."table_name")::regclass, 'pg_class')::json->>'previousName')`.as(
				"rename_from",
			),
			"information_schema.columns.identity_generation",
			"information_schema.columns.is_identity",
			"information_schema.table_constraints.constraint_name",
			"information_schema.constraint_column_usage.table_name as constraint_table_name",
			"information_schema.constraint_column_usage.column_name as constraint_column_name",
			"information_schema.table_constraints.constraint_type as constraint_type",
			"information_schema.table_constraints.nulls_distinct as constraint_nulls_distinct",
			"information_schema.referential_constraints.delete_rule",
			"information_schema.referential_constraints.update_rule",
			sql`pg_get_serial_sequence(information_schema.columns.table_name, information_schema.columns.column_name)`.as(
				"sequence_name",
			),
		])
		.select((eb) => [
			eb
				.case()
				.when(
					sql`
						pg_get_serial_sequence(information_schema.columns.table_name, information_schema.columns.column_name) IS NOT NULL
						AND information_schema.columns.data_type = 'integer'
						AND information_schema.columns.is_identity = 'NO'`,
				)
				.then("serial")
				.when(sql`
					pg_get_serial_sequence(information_schema.columns.table_name, information_schema.columns.column_name) IS NOT NULL
					AND information_schema.columns.data_type = 'bigint'
					AND information_schema.columns.is_identity = 'NO'`)
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
		.where("information_schema.columns.table_schema", "=", databaseSchema)
		.where("information_schema.columns.table_name", "in", tableNames)
		.orderBy("information_schema.columns.table_name asc")
		.orderBy("information_schema.columns.column_name asc")
		.execute();
}
function transformDbColumnInfo(
	info: Awaited<ReturnType<typeof fetchDbColumnInfo>>,
) {
	const transformed: ColumnInfo[] = [];
	for (const row of info) {
		let dataTypeFullName: string;
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
			case "character":
				dataTypeFullName = `char(${row.character_maximum_length})`;
				break;
			case "character varying":
				if (row.character_maximum_length !== null) {
					dataTypeFullName = `varchar(${row.character_maximum_length})`;
				} else {
					dataTypeFullName = "varchar";
				}
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
				dataTypeFullName = "int2";
				row.numeric_precision = null;
				row.numeric_scale = null;
				break;
			case "numeric":
				if (row.numeric_precision !== null && row.numeric_scale !== null) {
					dataTypeFullName = `${row.data_type}(${row.numeric_precision}, ${row.numeric_scale})`;
				} else {
					dataTypeFullName = row.data_type;
				}
				break;
			case "timestamp without time zone":
				dataTypeFullName = `timestamp(${row.datetime_precision})`;
				break;
			case "timestamp with time zone":
				dataTypeFullName = `timestamptz(${row.datetime_precision})`;
				break;
			case "time with time zone":
				dataTypeFullName = `timetz(${row.datetime_precision})`;
				break;
			case "time without time zone":
				dataTypeFullName = `time(${row.datetime_precision})`;
				break;
			default:
				dataTypeFullName = row.data_type || "";
				break;
		}
		transformed.push({
			tableName: row.table_name,
			columnName: row.column_name,
			dataType: dataTypeFullName,
			defaultValue: row.sequence_name === null ? row.column_default : null,
			isNullable: row.is_nullable,
			numericPrecision: row.numeric_precision,
			numericScale: row.numeric_scale,
			characterMaximumLength: row.character_maximum_length,
			datetimePrecision: row.datetime_precision,
			renameFrom: row.rename_from,
			primaryKey: row.constraint_type === "PRIMARY KEY" || null,
			foreignKeyConstraint:
				row.constraint_type !== null &&
				row.constraint_type === "FOREIGN KEY" &&
				row.constraint_table_name !== null &&
				row.table_name !== row.constraint_table_name &&
				row.constraint_column_name !== null &&
				row.delete_rule !== null &&
				row.update_rule !== null
					? {
							table: row.constraint_table_name,
							column: row.constraint_column_name,
							options: `${
								row.delete_rule.toLowerCase() as OnModifyForeignAction
							};${row.update_rule.toLowerCase() as OnModifyForeignAction}`,
					  }
					: null,
			identity:
				row.is_identity === "YES" && row.identity_generation !== null
					? row.identity_generation
					: null,
			unique:
				row.constraint_name !== null &&
				row.constraint_type !== null &&
				row.constraint_type === "UNIQUE" &&
				row.constraint_nulls_distinct !== null
					? row.constraint_nulls_distinct === "YES"
						? ColumnUnique.NullsDistinct
						: ColumnUnique.NullsNotDistinct
					: null,
		});
	}
	return transformed;
}
function mapColumnsToTables(columns: ColumnInfo[]) {
	return columns.reduce<TableColumnInfo>((acc, curr) => {
		if (curr.tableName !== null && curr.columnName !== null) {
			const currentTable = acc[curr.tableName];
			if (currentTable === undefined) {
				acc[curr.tableName] = {
					[curr.columnName as string]: curr,
				};
			} else {
				const columnInfo = {
					[curr.columnName as string]: curr,
				};
				acc[curr.tableName] = {
					...currentTable,
					...columnInfo,
				};
			}
		}
		return acc;
	}, {});
}
