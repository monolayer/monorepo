import type { IndexInfo } from "@monorepo/pg/introspection/index.js";
import { assert } from "vitest";

export function assertIndex(
	indexInfo: IndexInfo,
	opts: { table: string; key: string; definition: string },
) {
	const tableIndexes = indexInfo[opts.table];
	assert(tableIndexes, `Table "${opts.table}" has no indexes`);
	const index = tableIndexes[opts.key];
	assert(
		index,
		`Index "${opts.key}" with key on table "${opts.table}" is undefined`,
	);
	assert.strictEqual(index, opts.definition);
}

export function assertUndefinedIndex(
	indexInfo: IndexInfo,
	opts: { table: string; key: string },
) {
	const tableIndexes = indexInfo[opts.table];
	if (tableIndexes === undefined) {
		assert.isUndefined(tableIndexes);
	} else {
		assert.isUndefined(tableIndexes[opts.key]);
	}
}
