import { assert } from "vitest";
import type { SchemaMigrationInfo } from "~push/changeset/types/schema.js";

export function assertPrimaryKey(
	info: SchemaMigrationInfo,
	opts: {
		table: string;
		key: string;
		definition: string;
	},
) {
	const tablePrimaryKey = info.primaryKey[opts.table];
	assert(tablePrimaryKey, `Primary key for ${opts.table} is undefined`);
	const key = tablePrimaryKey[opts.key];
	assert(key, `Primary key "${key}" not found`);
	assert.strictEqual(key, opts.definition);
}
