import { uniqueToInfo } from "~/database/schema/table/constraints/unique/introspection.js";
import type { PgUnique } from "~/database/schema/table/constraints/unique/unique.js";
import type { PgIndex } from "~/database/schema/table/index/index.js";
import { indexToInfo } from "~/database/schema/table/index/introspection.js";
import { triggerInfo } from "~/database/schema/table/trigger/introspection.js";
import type { AnyTrigger } from "~/database/schema/table/trigger/trigger.js";
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