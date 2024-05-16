/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
	name: "20240516111840948-add-columns",
	transaction: true,
	dependsOn: "20240516111659418-add-boards",
	scaffold: false,
};

export async function up(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .createTable("columns")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("boardId", "integer", (col) => col.notNull())
    .addColumn("order", "double precision", (col) => col.notNull().defaultTo(sql`'0'::double precision`))
    .execute();

  await sql`COMMENT ON COLUMN "public"."columns"."id" IS 'eea9a3e7'`
    .execute(db);

  await sql`COMMENT ON COLUMN "public"."columns"."order" IS '6a590996'`
    .execute(db);

  await sql`create index "columns_78973606_monolayer_idx" on "public"."columns" ("boardId")`
    .execute(db);

  await db.withSchema("public").schema
    .alterTable("columns")
    .addPrimaryKeyConstraint("columns_monolayer_pk", ["id"])
    .execute();

  await sql`${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("columns")
    .addForeignKeyConstraint("columns_cd31e386_monolayer_fk", ["boardId"], "public.boards", ["id"])
    .onDelete("cascade")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}`.execute(db);

  await sql`ALTER TABLE "public"."columns" VALIDATE CONSTRAINT "columns_cd31e386_monolayer_fk"`
    .execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .dropTable("columns")
    .execute();
}
