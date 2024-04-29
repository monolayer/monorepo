/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export const migration = {
	scaffold: false,
	dependsOn: "20240405T120250-canopus-teal",
};

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
