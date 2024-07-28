/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";
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
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("canopus_teal").execute();
}
