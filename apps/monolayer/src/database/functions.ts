import { sql, type Kysely } from "kysely";
import type { InformationSchemaDB } from "~/introspection/types.js";

export async function databaseFunctions(db: Kysely<InformationSchemaDB>) {
	const results = await db
		.selectFrom("pg_proc")
		.leftJoin("pg_namespace", "pg_namespace.oid", "pg_proc.pronamespace")
		.leftJoin("pg_depend", (join) =>
			join
				.onRef("pg_depend.objid", "=", "pg_proc.oid")
				.onRef("pg_depend.classid", "=", sql`'pg_proc'::regclass`)
				.on("pg_depend.deptype", "=", "e"),
		)
		.leftJoin("pg_extension", "pg_extension.oid", "pg_depend.refobjid")
		.select(
			sql<string>`pg_catalog.pg_get_functiondef(pg_proc.oid)`.as("function"),
		)
		.where("pg_proc.proname", "!=", "pg_get_tabledef")
		.where("pg_proc.proname", "!=", "pg_get_coldef")
		.whereRef("pg_extension.oid", "is", sql.raw("null"))
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
		.execute();
	return results;
}
