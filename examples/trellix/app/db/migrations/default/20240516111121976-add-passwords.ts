/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
	name: "20240516111121976-add-passwords",
	transaction: true,
	dependsOn: "20240516110840356-add-accounts",
	scaffold: false,
};

export async function up(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .createTable("passwords")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`gen_random_uuid()`))
    .addColumn("salt", "text", (col) => col.notNull())
    .addColumn("hash", "text", (col) => col.notNull())
    .addColumn("accountId", "uuid", (col) => col.notNull())
    .execute();

  await sql`COMMENT ON COLUMN "public"."passwords"."id" IS 'eea9a3e7'`
    .execute(db);

  await sql`create index "passwords_c8367c81_monolayer_idx" on "public"."passwords" ("accountId")`
    .execute(db);

  await db.withSchema("public").schema
    .alterTable("passwords")
    .addUniqueConstraint("passwords_15e65ee2_monolayer_key", ["accountId"])
    .execute();

  await db.withSchema("public").schema
    .alterTable("passwords")
    .addPrimaryKeyConstraint("passwords_monolayer_pk", ["id"])
    .execute();

  await sql`${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("passwords")
    .addForeignKeyConstraint("passwords_73bf2dc0_monolayer_fk", ["accountId"], "public.accounts", ["id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}`.execute(db);

  await sql`ALTER TABLE "public"."passwords" VALIDATE CONSTRAINT "passwords_73bf2dc0_monolayer_fk"`
    .execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .dropTable("passwords")
    .execute();
}
