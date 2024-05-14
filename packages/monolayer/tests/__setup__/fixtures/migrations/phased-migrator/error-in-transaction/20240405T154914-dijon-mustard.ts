/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";
import type { Migration } from "~/migration.js";

export const migration = {
	name: "20240405T154914-dijon-mustard",
	dependsOn: "20240405T154913-mirfak-mustard",
	scaffold: false,
	transaction: true,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("dijon_mustard")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("mirfak_mustart").execute();
}
