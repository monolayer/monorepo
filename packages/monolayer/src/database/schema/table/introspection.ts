import { Kysely } from "kysely";
import type { InformationSchemaDB } from "../../../introspection/types.js";

export async function dbTableInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
) {
	return await queryDbTableInfo(kysely, databaseSchema);
}

export async function queryDbTableInfo(
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
