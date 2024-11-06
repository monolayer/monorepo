/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Migration } from "@monorepo/migrator/migration.js";
import { Kysely } from "kysely";

export const migration = {
	name: "20240405T153857-alphard-black",
	scaffold: false,
	transaction: false,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {}

export async function down(db: Kysely<any>): Promise<void> {}
