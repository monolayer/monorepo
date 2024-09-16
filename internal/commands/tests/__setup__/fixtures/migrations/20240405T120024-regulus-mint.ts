/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export const migration = {
	scaffold: false,
};

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
