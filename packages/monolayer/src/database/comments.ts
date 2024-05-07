import { sql, type Kysely } from "kysely";
import type { InformationSchemaDB } from "~/introspection/types.js";

export async function databaseComments(db: Kysely<InformationSchemaDB>) {
	const columnComments = db
		.selectFrom("pg_attribute")
		.leftJoin("pg_class", "pg_class.oid", "pg_attribute.attrelid")
		.leftJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
		.select([
			sql<string>`pg_namespace.nspname`.as("schema"),
			sql<string>`'COMMENT ON COLUMN ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || '.' || quote_ident(pg_attribute.attname) || ' IS ' || quote_literal(col_description(pg_attribute.attrelid, pg_attribute.attnum)) || ';'`.as(
				"ddl",
			),
		])
		.where(({ eb, or }) =>
			or([
				eb(
					sql`obj_description(pg_namespace.oid, 'pg_namespace')`,
					"=",
					"monolayer",
				),
				eb("pg_namespace.nspname", "=", "public"),
			]),
		)
		.where(({ eb, and }) =>
			and([
				eb("pg_attribute.attnum", ">", 0),
				eb(
					sql`col_description(pg_attribute.attrelid, pg_attribute.attnum)`,
					"is not",
					sql.raw("null"),
				),
				eb("pg_attribute.attisdropped", "is not", true),
			]),
		);
	const typeComments = db
		.selectFrom("pg_type")
		.leftJoin("pg_namespace", "pg_namespace.oid", "pg_type.typnamespace")
		.select([
			sql<string>`pg_namespace.nspname`.as("schema"),
			sql<string>`'COMMENT ON TYPE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_type.typname) || ' IS ' || quote_literal(obj_description(pg_type.oid, 'pg_type')) || ';'`.as(
				"ddl",
			),
		])
		.where(
			sql`obj_description(pg_type.oid, 'pg_type')`,
			"is not",
			sql.raw("null"),
		)
		.where(({ eb, or }) =>
			or([
				eb(
					sql`obj_description(pg_namespace.oid, 'pg_namespace')`,
					"=",
					"monolayer",
				),
				eb("pg_namespace.nspname", "=", "public"),
			]),
		)
		.where((eb) =>
			eb.or([
				eb(sql`obj_description(pg_type.oid, 'pg_type')`, "=", "monolayer"),
			]),
		);

	const triggerComments = db
		.selectFrom("pg_trigger")
		.leftJoin("pg_class", "pg_class.oid", "pg_trigger.tgrelid")
		.leftJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
		.select([
			sql<string>`pg_namespace.nspname`.as("schema"),
			sql<string>`'COMMENT ON TRIGGER ' || quote_ident(pg_trigger.tgname) || ' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' IS ' || quote_literal(obj_description(pg_trigger.oid, 'pg_trigger')) || ';'`.as(
				"ddl",
			),
		])
		.where(
			sql`obj_description(pg_trigger.oid, 'pg_trigger')`,
			"is not",
			sql.raw("null"),
		)
		.where(({ eb, or }) =>
			or([
				eb(
					sql`obj_description(pg_trigger.oid, 'pg_trigger')`,
					"=",
					"monolayer",
				),
				eb("pg_namespace.nspname", "=", "public"),
			]),
		);

	const schemaComments = db
		.selectFrom("pg_namespace")
		.select([
			"pg_namespace.nspname as schema",
			sql<string>`'COMMENT ON SCHEMA ' || quote_ident(pg_namespace.nspname) || ' IS ' || quote_literal(obj_description(pg_namespace.oid, 'pg_namespace')) || ';'`.as(
				"ddl",
			),
		])
		.where(sql`obj_description(oid, 'pg_namespace')`, "=", "monolayer");
	return await schemaComments
		.unionAll(columnComments)
		.unionAll(typeComments)
		.unionAll(triggerComments)
		.execute();
}
