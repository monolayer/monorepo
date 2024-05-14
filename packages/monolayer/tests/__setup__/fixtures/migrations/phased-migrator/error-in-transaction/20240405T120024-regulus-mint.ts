/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";
import type { Migration } from "~/migration.js";

export const migration = {
	name: "20240405T120024-regulus-mint",
	dependsOn: {
		__noDependencies__: true,
	},
	scaffold: false,
	transaction: true,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("regulus_mint")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("regulus_mint").execute();
}
