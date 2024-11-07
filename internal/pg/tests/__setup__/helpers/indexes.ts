import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { indexToInfo } from "~pg/introspection/index.js";
import { triggerInfo } from "~pg/introspection/trigger.js";
import { uniqueToInfo } from "~pg/introspection/unique.js";
import type { PgIndex } from "~pg/schema/index.js";
import type { AnyTrigger } from "~pg/schema/trigger.js";
import type { PgUnique } from "~pg/schema/unique.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function compileIndex(index: PgIndex<any>, tableName: string) {
	const kysely = kyselyWithEmptyPool();
	return indexToInfo(index, tableName, kysely, false);
}

export async function compileUnique(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	unique: PgUnique<any>,
	tableName: string,
	schemaName: string,
) {
	const kysely = await kyselyWithEmptyPool();
	return uniqueToInfo(unique, tableName, kysely, false, {}, schemaName);
}

export async function compileTrigger(
	trigger: AnyTrigger,
	triggerName: string,
	tableName: string,
	camelCase = false,
) {
	const kysely = await kyselyWithEmptyPool();

	return triggerInfo(
		trigger,
		triggerName,
		tableName,
		kysely,
		camelCase,
		"public",
	);
}

function kyselyWithEmptyPool() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
}
