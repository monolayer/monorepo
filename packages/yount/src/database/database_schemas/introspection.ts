import { sql, type Kysely } from "kysely";
import type { InformationSchemaDB } from "~/introspection/types.js";

export async function schemaInDb(
	kysely: Kysely<InformationSchemaDB>,
	schemaName: string,
) {
	const results = await kysely
		.selectFrom("information_schema.schemata")
		.fullJoin("pg_namespace", (join) =>
			join.onRef(
				"information_schema.schemata.schema_name",
				"=",
				"pg_namespace.nspname",
			),
		)
		.select([
			sql<string>`information_schema.schemata.schema_name`.as("name"),
			sql<string | null>`obj_description(pg_namespace.oid, 'pg_namespace')`.as(
				"comment",
			),
			"information_schema.schemata.schema_owner",
		])
		.where("information_schema.schemata.schema_name", "!=", "public")
		.execute();
	return results
		.filter((result) => (result.comment ?? "").match(/yount/))
		.filter((result) => result.name === schemaName);
}
