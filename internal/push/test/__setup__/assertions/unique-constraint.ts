import { assert } from "vitest";
import type { SchemaMigrationInfo } from "~push/changeset/types/schema.js";

export function assertUniqueConstraint(
	info: SchemaMigrationInfo,
	opts: {
		table: string;
		key: string;
		definition: string;
	},
) {
	const tableUniqueConstraints = info.uniqueConstraints[opts.table];
	assert(
		tableUniqueConstraints,
		`Unique constraints for ${opts.table} is undefined`,
	);
	const key = tableUniqueConstraints[opts.key];
	assert(key, `Unique constraint "${opts.key}" not found`);
	assert.strictEqual(key, opts.definition);
}
