/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import type { Migration } from "~/migration.js";

export const migration = {
	name: "20240405T120250-canopus-teal",
	scaffold: false,
	transaction: false,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("canopus_teal")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();

	await sql`CREATE INDEX CONCURRENTLY canopus_teal_name_idx ON canopus_teal (name);`.execute(
		db,
	);
}

export async function down(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.dropIndex("canopus_teal_name_idx")
		.execute();
	await db.withSchema("public").schema.dropTable("canopus_teal").execute();
}
