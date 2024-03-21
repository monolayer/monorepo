import type { PgIndex } from "~/schema/index/index.js";
import { indexToInfo } from "~/schema/index/introspection.js";
import { triggerInfo } from "~/schema/trigger/introspection.js";
import type { PgTrigger } from "~/schema/trigger/trigger.js";
import { uniqueToInfo } from "~/schema/unique/introspection.js";
import type { PgUnique } from "~/schema/unique/unique.js";
import { kyselyWithEmptyPool } from "~tests/setup/kysely.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function compileIndex(index: PgIndex<any>, tableName: string) {
	const kysely = await kyselyWithEmptyPool();
	const opts = {
		enabled: false,
		options: {},
	};
	return indexToInfo(index, tableName, kysely, opts);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function compileUnique(unique: PgUnique<any>, tableName: string) {
	const kysely = await kyselyWithEmptyPool();
	return uniqueToInfo(unique, tableName, kysely, {
		enabled: false,
		options: {},
	});
}

export async function compileTrigger(
	trigger: PgTrigger,
	triggerName: string,
	tableName: string,
	camelCase = false,
) {
	const kysely = await kyselyWithEmptyPool();

	return triggerInfo(trigger, triggerName, tableName, kysely, {
		enabled: camelCase,
		options: {},
	});
}
