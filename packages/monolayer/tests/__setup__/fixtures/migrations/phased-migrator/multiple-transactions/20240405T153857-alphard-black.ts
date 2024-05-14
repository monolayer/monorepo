/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import type { Migration } from "~/migration.js";

export const migration = {
	name: "20240405T153857-alphard-black",
	dependsOn: "20240405T120250-canopus-teal",
	scaffold: false,
	transaction: false,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("alphard_black")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();

	await sql`CREATE INDEX CONCURRENTLY alphard_black_idx ON alphard_black (name);`.execute(
		db,
	);
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("alphard_black").execute();
}
