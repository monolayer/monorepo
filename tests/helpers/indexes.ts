import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import {
	indexToInfo,
	triggerInfo,
	uniqueToInfo,
} from "~/database/introspection/local_schema.js";
import type { PgIndex } from "~/database/schema/pg_index.js";
import type { PgTrigger } from "~/database/schema/pg_trigger.js";
import type { PgUnique } from "~/database/schema/pg_unique.js";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function compileIndex(index: PgIndex<any>, tableName: string) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const opts = {
		enabled: false,
		options: {},
	};
	return indexToInfo(index, tableName, kysely, opts);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function compileUnique(unique: PgUnique<any>, tableName: string) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	return uniqueToInfo(unique, tableName, kysely, {
		enabled: false,
		options: {},
	});
}

export function compileTrigger(
	trigger: PgTrigger,
	triggerName: string,
	tableName: string,
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	return triggerInfo(trigger, triggerName, tableName, kysely, {
		enabled: false,
		options: {},
	});
}
