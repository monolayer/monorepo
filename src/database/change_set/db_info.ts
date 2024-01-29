import { Kysely, sql } from "kysely";
import {
	ActionStatus,
	OperationAnyError,
	OperationSuccess,
} from "~/cli/command.js";
import { ColumnInfo } from "./column_info.js";
import { TableInfo } from "./table_diff.js";

type InformationSchemaTables = {
	table_catalog: string | null;
	table_schema: string | null;
	table_name: string | null;
	table_type: string | null;
	self_referencing_column_name: string | null;
	reference_generation: string | null;
	user_defined_type_catalog: string | null;
	user_defined_type_schema: string | null;
	user_defined_type_name: string | null;
	is_insertable_into: string | null;
	is_typed: string | null;
	commit_action: string | null;
};

type InformationSchemaColumns = {
	numeric_precision: number | null;
	numeric_precision_radix: number | null;
	numeric_scale: number | null;
	datetime_precision: number | null;
	ordinal_position: number | null;
	maximum_cardinality: number | null;
	interval_precision: number | null;
	character_maximum_length: number | null;
	character_octet_length: number | null;
	character_set_schema: string | null;
	character_set_name: string | null;
	collation_catalog: string | null;
	collation_schema: string | null;
	collation_name: string | null;
	domain_catalog: string | null;
	domain_schema: string | null;
	domain_name: string | null;
	udt_catalog: string | null;
	udt_schema: string | null;
	udt_name: string | null;
	scope_catalog: string | null;
	scope_schema: string | null;
	scope_name: string | null;
	dtd_identifier: string | null;
	is_self_referencing: string | null;
	is_identity: string | null;
	identity_generation: string | null;
	identity_start: string | null;
	identity_increment: string | null;
	identity_maximum: string | null;
	identity_minimum: string | null;
	identity_cycle: string | null;
	is_generated: string | null;
	generation_expression: string | null;
	table_catalog: string | null;
	is_updatable: string | null;
	table_schema: string | null;
	table_name: string | null;
	column_name: string | null;
	column_default: string | null;
	is_nullable: string | null;
	data_type: string | null;
	interval_type: string | null;
	character_set_catalog: string | null;
	nullable: boolean | null;
	renameFrom: string | null;
};

type InformationSchemaDB = {
	"information_schema.tables": InformationSchemaTables;
	"information_schema.columns": InformationSchemaColumns;
};

export async function dbTableInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
): Promise<
	| {
			status: ActionStatus.Success;
			result: {
				name: string | null;
				schemaName: string | null;
			}[];
	  }
	| OperationAnyError
> {
	try {
		const results = await queryDbTableInfo(kysely, databaseSchema);
		return {
			status: ActionStatus.Success,
			result: results,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}

async function queryDbTableInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
) {
	return await kysely
		.selectFrom("information_schema.tables")
		.select(["table_name as name", "table_schema as schemaName"])
		.where("table_schema", "=", databaseSchema)
		.where("table_name", "!=", "geometry_columns")
		.where("table_name", "!=", "spatial_ref_sys")
		.where("table_name", "!=", "kysely_migration_lock")
		.where("table_name", "!=", "kysely_migration")
		.where("table_type", "!=", "VIEW")
		.execute();
}

export async function dbColumnInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<TableInfo> | OperationAnyError> {
	try {
		const results = await fetchDbColumnInfo(kysely, databaseSchema, tableNames);
		const transformed = transformDbColumnInfo(results);
		const mapped = mapColumnsToTables(transformed);
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
		.select([
			"table_name",
			"column_name",
			"data_type",
			"column_default",
			sql<boolean>`CASE WHEN is_nullable = 'YES' THEN true ELSE false END`.as(
				"is_nullable",
			),
			"numeric_precision",
			"numeric_scale",
			"character_maximum_length",
			"datetime_precision",
			sql<
				string | null
			>`(SELECT obj_description(('public.' || "table_name")::regclass, 'pg_class')::json->>'previousName')`.as(
				"rename_from",
			),
		])
		.where("table_schema", "=", databaseSchema)
		.where("table_name", "in", tableNames)
		.orderBy("table_name asc")
		.orderBy("column_name asc")
		.execute();
}

function transformDbColumnInfo(
	info: Awaited<ReturnType<typeof fetchDbColumnInfo>>,
) {
	const transformed: ColumnInfo[] = [];
	for (const row of info) {
		const match = row.column_default?.match(/^'(.+)\:\:.+$/);
		if (match && match[1] !== undefined) {
			row.column_default = match[1].replace(/'/g, "");
		}
		let dataTypeFullName: string;
		switch (row.data_type) {
			case "bigint":
				row.numeric_precision = null;
				row.numeric_scale = null;
				dataTypeFullName = row.data_type;
				if (
					row.column_default?.startsWith(
						`nextval('${row.table_name}_${row.column_name}_seq'`,
					)
				) {
					row.column_default = null;
				}
				break;
			case "double precision":
				row.numeric_precision = null;
				row.numeric_scale = null;
				dataTypeFullName = row.data_type;
				break;
			case "character":
				if (row.character_maximum_length !== null) {
					dataTypeFullName = `char(${row.character_maximum_length})`;
				} else {
					dataTypeFullName = "char";
				}
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
				} else if (row.numeric_precision !== null) {
					dataTypeFullName = `${row.data_type}(${row.numeric_precision})`;
				} else {
					dataTypeFullName = row.data_type;
				}
				break;
			case "timestamp without time zone":
				if (row.datetime_precision !== null) {
					dataTypeFullName = `timestamp(${row.datetime_precision})`;
				} else {
					dataTypeFullName = "timestamp";
				}
				break;
			case "timestamp with time zone":
				if (row.datetime_precision !== null) {
					dataTypeFullName = `timestamptz(${row.datetime_precision})`;
				} else {
					dataTypeFullName = "timestamptz";
				}
				break;
			case "time with time zone":
				if (row.datetime_precision !== null) {
					dataTypeFullName = `timetz(${row.datetime_precision})`;
				} else {
					dataTypeFullName = "timetz";
				}
				break;
			case "time without time zone":
				if (row.datetime_precision !== null) {
					dataTypeFullName = `time(${row.datetime_precision})`;
				} else {
					dataTypeFullName = "time";
				}
				break;
			default:
				dataTypeFullName = row.data_type || "";
				break;
		}
		transformed.push({
			tableName: row.table_name,
			columnName: row.column_name,
			dataType: dataTypeFullName,
			default: row.column_default,
			isNullable: row.is_nullable,
			numericPrecision: row.numeric_precision,
			numericScale: row.numeric_scale,
			characterMaximumLength: row.character_maximum_length,
			datetimePrecision: row.datetime_precision,
			renameFrom: row.rename_from,
		});
	}
	return transformed;
}
function mapColumnsToTables(columns: ColumnInfo[]) {
	return columns.reduce<TableInfo>((acc, curr) => {
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
