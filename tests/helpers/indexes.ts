import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import {
	indexToInfo,
	uniqueToInfo,
} from "~/database/introspection/local_schema.js";
import type { PgIndex } from "~/database/schema/pg_index.js";
import type { PgUnique } from "~/database/schema/pg_unique.js";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function compileIndex(index: PgIndex<any>, tableName: string) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	return indexToInfo(index, tableName, kysely);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function compileUnique(unique: PgUnique<any>, tableName: string) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	return uniqueToInfo(unique, tableName, kysely);
}
