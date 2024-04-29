/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export const revision = {
	scaffold: false,
	dependsOn: "20240405T153857-alphard-black",
};

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.withSchema("public")
		.schema.createTable("mirfak_mustart")
		.addColumn("name", "text", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.withSchema("public").schema.dropTable("mirfak_mustart").execute();
}
