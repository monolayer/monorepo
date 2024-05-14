/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import type { Migration } from "~/migration.js";

export const migration = {
	name: "20240405T154913-mirfak-mustard",
	dependsOn: "20240405T153857-alphard-black",
	scaffold: false,
	transaction: true,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("mirfak_mustart")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();
	await sql`CREATE INDEX alphard_black_idx ON alphard_blallck (name);`.execute(
		db,
	);
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("mirfak_mustart").execute();
}
