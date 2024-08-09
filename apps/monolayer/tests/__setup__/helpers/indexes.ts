import { indexToInfo } from "@monorepo/pg/introspection/index.js";
import { triggerInfo } from "@monorepo/pg/introspection/trigger.js";
import { uniqueToInfo } from "@monorepo/pg/introspection/unique.js";
import type { PgIndex } from "@monorepo/pg/schema/index.js";
import type { AnyTrigger } from "@monorepo/pg/schema/trigger.js";
import type { PgUnique } from "@monorepo/pg/schema/unique.js";
import { kyselyWithEmptyPool } from "~tests/__setup__/helpers/kysely.js";

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
