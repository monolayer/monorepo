import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { indexToInfo } from "~/database/introspection/indexes.js";
import { triggerInfo } from "~/database/introspection/triggers.js";
import { uniqueToInfo } from "~/database/introspection/unique_constraint.js";
import type { PgIndex } from "~/database/schema/pg_index.js";
import type { PgTrigger } from "~/database/schema/pg_trigger.js";
import type { PgUnique } from "~/database/schema/pg_unique.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compileIndex(index: PgIndex<any>, tableName: string) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compileUnique(unique: PgUnique<any>, tableName: string) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
