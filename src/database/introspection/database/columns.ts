import { Kysely, sql } from "kysely";
import {
	ActionStatus,
	OperationAnyError,
	OperationSuccess,
} from "~/cli/command.js";
import { ColumnInfo } from "../../schema/pg_column.js";
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
		for (const table of tableNames) {
			if (mapped[table] === undefined) {
				mapped[table] = {};
			}
		}
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
		.leftJoin(
			(eb) =>
				eb
					.selectFrom("information_schema.table_constraints as tc")
					.leftJoin("information_schema.key_column_usage as kcu", (join) =>
						join
							.onRef("tc.constraint_name", "=", "kcu.constraint_name")
							.onRef("tc.table_schema", "=", "kcu.table_schema"),
					)
					.leftJoin(
						"information_schema.referential_constraints as rc",
						(join) =>
							join
								.onRef("tc.constraint_name", "=", "rc.constraint_name")
								.onRef("tc.table_schema", "=", "rc.constraint_schema"),
					)
					.leftJoin(
						(eb) =>
							eb
								.selectFrom("information_schema.referential_constraints as rc")
								.leftJoin(
									"information_schema.key_column_usage as kcu",
									(join) =>
										join.onRef(
											"rc.unique_constraint_name",
											"=",
											"kcu.constraint_name",
										),
								)
								.select([
									"rc.constraint_name",
									"kcu.table_name as target_table",
									sql<string[]>`json_agg(kcu.column_name)`.as("target_columns"),
								])
								.groupBy(["rc.constraint_name", "kcu.table_name"])
								.as("fk"),
						(join) =>
							join.onRef("tc.constraint_name", "=", "fk.constraint_name"),
					)
					.select([
						"tc.table_schema",
						"tc.table_name",
						"kcu.column_name",
						sql<
							{
								constraint_name: string;
								constraint_type: string;
								columns: string[];
								delete_rule: string | null;
								update_rule: string | null;
								sequence_name: string | null;
								target_table: string | null;
								target_columns: string[];
								nulls_distinct: string | null;
							}[]
						>`
							json_agg(
								DISTINCT jsonb_build_object(
									'constraint_name', tc.constraint_name,
									'constraint_type', tc.constraint_type,
									'nulls_distinct', tc.nulls_distinct,
									'columns', (SELECT array_agg(kcu_inner.column_name ORDER BY kcu_inner.ordinal_position)
															FROM information_schema.key_column_usage kcu_inner
															WHERE kcu_inner.constraint_name = tc.constraint_name
															GROUP BY kcu_inner.constraint_name),
									'delete_rule', rc.delete_rule,
									'update_rule', rc.update_rule,
									'sequence_name', pg_get_serial_sequence(tc.table_schema || '.' || tc.table_name, kcu.column_name),
									'target_table', fk.target_table,
									'target_columns', fk.target_columns
									)
								)
							`.as("constraints"),
					])
					.where("tc.table_schema", "=", databaseSchema)
					.where("tc.table_name", "in", tableNames)
					.groupBy(["tc.table_schema", "tc.table_name", "kcu.column_name"])
					.as("c"),
			(join) =>
				join
					.onRef("c.table_name", "=", "information_schema.columns.table_name")
					.onRef(
						"c.column_name",
						"=",
						"information_schema.columns.column_name",
					),
		)
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
			sql<
				string | null
			>`(SELECT obj_description(('public.' || "information_schema"."columns"."table_name")::regclass, 'pg_class')::json->>'previousName')`.as(
				"rename_from",
			),
			"information_schema.columns.identity_generation",
			"information_schema.columns.is_identity",
			sql`pg_get_serial_sequence(information_schema.columns.table_name, information_schema.columns.column_name)`.as(
				"sequence_name",
			),
			"c.constraints",
			"pg_attribute.atttypmod",
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
				dataTypeFullName =
					row.atttypmod === -1
						? "char"
						: `char(${row.character_maximum_length})`;
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
				dataTypeFullName =
					row.atttypmod === -1
						? "timestamp"
						: `timestamp(${row.datetime_precision})`;
				row.datetime_precision =
					row.atttypmod === -1 ? null : row.datetime_precision;
				break;
			case "timestamp with time zone":
				dataTypeFullName =
					row.atttypmod === -1
						? "timestamptz"
						: `timestamptz(${row.datetime_precision})`;
				row.datetime_precision =
					row.atttypmod === -1 ? null : row.datetime_precision;
				break;
			case "time with time zone":
				dataTypeFullName =
					row.atttypmod === -1 ? "timetz" : `timetz(${row.datetime_precision})`;
				row.datetime_precision =
					row.atttypmod === -1 ? null : row.datetime_precision;
				break;
			case "time without time zone":
				dataTypeFullName =
					row.atttypmod === -1 ? "time" : `time(${row.datetime_precision})`;
				row.datetime_precision =
					row.atttypmod === -1 ? null : row.datetime_precision;
				break;
			default:
				dataTypeFullName = row.data_type || "";
				break;
		}

		transformed.push({
			tableName: row.table_name,
			columnName: row.column_name,
			dataType:
				row.user_defined_type_name !== null
					? row.user_defined_type_name
					: dataTypeFullName,
			defaultValue: row.sequence_name === null ? row.column_default : null,
			isNullable: row.is_nullable,
			numericPrecision: row.numeric_precision,
			numericScale: row.numeric_scale,
			characterMaximumLength: row.character_maximum_length,
			datetimePrecision: row.datetime_precision,
			renameFrom: row.rename_from,
			identity:
				row.is_identity === "YES" && row.identity_generation !== null
					? row.identity_generation
					: null,
			enum: row.user_defined_type_name !== null,
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
