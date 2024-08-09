import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { indexToInfo } from "../../../src/introspection/index.js";
import { triggerInfo } from "../../../src/introspection/trigger.js";
import { uniqueToInfo } from "../../../src/introspection/unique.js";
import type { PgIndex } from "./../../../src/schema/index.js";
import type { AnyTrigger } from "./../../../src/schema/trigger.js";
import type { PgUnique } from "./../../../src/schema/unique.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function compileIndex(index: PgIndex<any>, tableName: string) {
	const kysely = await kyselyWithEmptyPool();
	const opts = {
		enabled: false,
		options: {},
	};
	return indexToInfo(index, tableName, kysely, opts);
}

export async function compileUnique(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	unique: PgUnique<any>,
	tableName: string,
	schemaName: string,
) {
	const kysely = await kyselyWithEmptyPool();
	return uniqueToInfo(
		unique,
		tableName,
		kysely,
		{
			enabled: false,
			options: {},
		},
		{},
		schemaName,
	);
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
		{
			enabled: camelCase,
			options: {},
		},
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
