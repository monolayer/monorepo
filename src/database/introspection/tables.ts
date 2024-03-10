import { Kysely } from "kysely";
import { ActionStatus, OperationAnyError } from "~/cli/command.js";
import type { InformationSchemaDB } from "./types.js";

type TableInfoSuccess = {
	status: ActionStatus.Success;
	result: {
		name: string | null;
		schemaName: string | null;
	}[];
};

export async function dbTableInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
): Promise<TableInfoSuccess | OperationAnyError> {
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
