import { assert } from "vitest";
import type { SchemaMigrationInfo } from "~db-push/changeset/types/schema.js";

export function assertCheckConstraint(
	info: SchemaMigrationInfo,
	opts: {
		table: string;
		key: string;
		definition: string;
	},
) {
	const tableUniqueConstraints = info.checkConstraints[opts.table];
	assert(
		tableUniqueConstraints,
		`Check constraints for ${opts.table} is undefined`,
	);
	const key = tableUniqueConstraints[opts.key];
	assert(key, `Check constraint "${key}" not found`);
	assert.strictEqual(key, opts.definition);
}

export function assertUndefinedCheckConstraint(
	info: SchemaMigrationInfo,
	opts: {
		table: string;
		key: string;
	},
) {
	const tableUniqueConstraints = info.checkConstraints[opts.table];
	if (tableUniqueConstraints === undefined) {
		assert.isUndefined(tableUniqueConstraints);
	} else {
		assert.isUndefined(tableUniqueConstraints[opts.key]);
	}
}
