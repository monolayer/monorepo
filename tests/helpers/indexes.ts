import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { indexMeta, pgIndex } from "~/database/schema/pg_index.js";

export function compileIndex(index: pgIndex, tableName: string) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const meta = indexMeta(index);
	const compiledQuery = meta
		.builder(kysely.schema.createIndex(meta.name).on(tableName))
		.compile().sql;
	return {
		[meta.name]: compiledQuery,
	};
}
