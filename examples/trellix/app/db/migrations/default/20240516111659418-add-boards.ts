/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
	name: "20240516111659418-add-boards",
	transaction: true,
	dependsOn: "20240516111121976-add-passwords",
	scaffold: false,
};

export async function up(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .createTable("boards")
    .addColumn("id", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("color", "text", (col) => col.notNull().defaultTo(sql`'#e0e0e0'::text`))
    .addColumn("createdAt", sql`timestamp with time zone`, (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("accountId", "uuid", (col) => col.notNull())
    .execute();

  await sql`COMMENT ON COLUMN "public"."boards"."color" IS '22216187'`
    .execute(db);

  await sql`COMMENT ON COLUMN "public"."boards"."createdAt" IS '28a4dae0'`
    .execute(db);

  await sql`create index "boards_c8367c81_monolayer_idx" on "public"."boards" ("accountId")`
    .execute(db);

  await db.withSchema("public").schema
    .alterTable("boards")
    .addPrimaryKeyConstraint("boards_monolayer_pk", ["id"])
    .execute();

  await sql`${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("boards")
    .addForeignKeyConstraint("boards_58e1a15a_monolayer_fk", ["accountId"], "public.accounts", ["id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}`.execute(db);

  await sql`ALTER TABLE "public"."boards" VALIDATE CONSTRAINT "boards_58e1a15a_monolayer_fk"`
    .execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .dropTable("boards")
    .execute();
}
