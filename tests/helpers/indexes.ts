import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { PgIndex } from "~/index.js";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function compileIndex(index: PgIndex<any>, tableName: string) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const indexName = `${tableName}_${index.columns.join("_")}_kntc_idx`;
	const kyselyBuilder = kysely.schema
		.createIndex(indexName)
		.on(tableName) as Parameters<typeof index._builder>[0];

	const compiledQuery = index
		._builder(kyselyBuilder)
		.columns(index.columns)
		.compile().sql;
	return {
		[indexName]: compiledQuery,
	};
}
