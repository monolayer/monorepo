/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export const revision = {
	scaffold: false,
	dependsOn: "20240405T120024-regulus-mint",
};

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("regulur_door")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("regulur_door").execute();
}
