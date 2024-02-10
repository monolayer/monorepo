import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { indexToInfo } from "~/database/introspection/local_schema.js";
import type { PgIndex } from "~/index.js";

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
