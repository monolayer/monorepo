/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { NO_DEPENDENCY, Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "20240516110840356-add-accounts",
  transaction: true,
  dependsOn: NO_DEPENDENCY,
  scaffold: false,
};

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .withSchema("public")
    .schema.createTable("accounts")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`gen_random_uuid()`))
    .addColumn("email", "text", (col) => col.notNull())
    .execute();

  await sql`COMMENT ON COLUMN "public"."accounts"."id" IS 'eea9a3e7'`.execute(
    db,
  );

  await sql`create index "accounts_cf8cf26f_monolayer_idx" on "public"."accounts" ("email")`.execute(
    db,
  );

  await db
    .withSchema("public")
    .schema.alterTable("accounts")
    .addUniqueConstraint("accounts_f368ca51_monolayer_key", ["email"])
    .execute();

  await db
    .withSchema("public")
    .schema.alterTable("accounts")
    .addPrimaryKeyConstraint("accounts_pkey", ["id"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema.dropTable("accounts").execute();
}
