/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "20240516112102254-add-items",
  transaction: true,
  dependsOn: "20240516111840948-add-columns",
  scaffold: false,
};

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .withSchema("public")
    .schema.createTable("items")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`gen_random_uuid()`))
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("content", "text")
    .addColumn("order", "real", (col) => col.notNull())
    .addColumn("columnId", "uuid", (col) => col.notNull())
    .addColumn("boardId", "integer", (col) => col.notNull())
    .execute();

  await sql`COMMENT ON COLUMN "public"."items"."id" IS 'eea9a3e7'`.execute(db);

  await sql`create index "items_78973606_monolayer_idx" on "public"."items" ("boardId")`.execute(
    db,
  );

  await sql`create index "items_1620437a_monolayer_idx" on "public"."items" ("columnId")`.execute(
    db,
  );

  await db
    .withSchema("public")
    .schema.alterTable("items")
    .addPrimaryKeyConstraint("items_pkey", ["id"])
    .execute();

  await sql`${sql.raw(
    db
      .withSchema("public")
      .schema.alterTable("items")
      .addForeignKeyConstraint(
        "items_96b4f219_monolayer_fk",
        ["boardId"],
        "public.boards",
        ["id"],
      )
      .onDelete("cascade")
      .onUpdate("cascade")
      .compile()
      .sql.concat(" not valid"),
  )}`.execute(db);

  await sql`ALTER TABLE "public"."items" VALIDATE CONSTRAINT "items_96b4f219_monolayer_fk"`.execute(
    db,
  );

  await sql`${sql.raw(
    db
      .withSchema("public")
      .schema.alterTable("items")
      .addForeignKeyConstraint(
        "items_42a31803_monolayer_fk",
        ["columnId"],
        "public.columns",
        ["id"],
      )
      .onDelete("cascade")
      .onUpdate("cascade")
      .compile()
      .sql.concat(" not valid"),
  )}`.execute(db);

  await sql`ALTER TABLE "public"."items" VALIDATE CONSTRAINT "items_42a31803_monolayer_fk"`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema.dropTable("items").execute();
}
