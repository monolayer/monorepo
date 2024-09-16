/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";
import type { Migration } from "~monolayer/migration.js";

export const migration = {
	name: "20240405T153857-alphard-black",
	scaffold: false,
	transaction: true,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("alphard_black")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("alphard_black").execute();
}
