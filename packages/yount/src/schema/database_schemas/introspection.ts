import { sql, type Kysely } from "kysely";
import type { InformationSchemaDB } from "~/introspection/types.js";

export async function schemaInDb(
	kysely: Kysely<InformationSchemaDB>,
	schemaName: string,
) {
	return await kysely
		.selectFrom("information_schema.schemata")
		.select([sql<boolean>`true`.as("exists")])
		.where("schema_name", "=", schemaName)
		.execute();
}
