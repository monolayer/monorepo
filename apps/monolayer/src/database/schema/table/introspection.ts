import { Kysely, sql } from "kysely";
import type { InformationSchemaDB } from "../../../introspection/types.js";
import { createTableDefFunction } from "./pg-get-table-def.js";

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
		.where("table_name", "!=", "monolayer_alter_migration_lock")
		.where("table_name", "!=", "monolayer_alter_migration")
		.where("table_name", "!=", "monolayer_expand_migration_lock")
		.where("table_name", "!=", "monolayer_expand_migration")
		.where("table_name", "!=", "monolayer_contract_migration_lock")
		.where("table_name", "!=", "monolayer_contract_migration")
		.where("table_name", "!=", "monolayer_data_migration_lock")
		.where("table_name", "!=", "monolayer_data_migration")
		.where("table_type", "!=", "VIEW")
		.execute();
}

export async function tableDumpInfo(db: Kysely<InformationSchemaDB>) {
	await createTableDefFunction(db);

	return await db
		.selectFrom("pg_class")
		.leftJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
		.where("pg_class.relkind", "=", "r")
		.where((eb) =>
			eb.or([
				eb("pg_namespace.nspname", "=", "public"),
				eb(
					sql`obj_description(pg_namespace.oid, 'pg_namespace')`,
					"=",
					"monolayer",
				),
			]),
		)
		.where("pg_namespace.nspname", "=", "public")
		.select([
			"pg_namespace.nspname as schema",
			"pg_class.relname as name",
			sql<string>`public.pg_get_tabledef(nspname::text, relname::text, false, 'PKEY_EXTERNAL', 'FKEYS_EXTERNAL', 'COMMENTS', 'INCLUDE_TRIGGERS')`.as(
				"table",
			),
		])
		.orderBy(["nspname", "relname"])
		.execute();
}
