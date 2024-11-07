import type { ForeignKeyIntrospection } from "@monorepo/pg/introspection/table.js";
import { assert } from "vitest";
import type { SchemaMigrationInfo } from "~push/changeset/types/schema.js";

export function assertForeignKey(
	info: SchemaMigrationInfo,
	opts: {
		table: string;
		key: string;
		definition: Omit<ForeignKeyIntrospection, "deleteRule" | "updateRule"> & {
			deleteRule: string;
			updateRule: string;
		};
	},
) {
	const tableForeignKeys = info.foreignKeyDefinitions![opts.table];
	assert(tableForeignKeys, `Foreign keys for ${opts.table} is undefined`);
	const key = tableForeignKeys[opts.key];
	assert(key, `Foreign Key "${key}" not found`);
	assert.deepStrictEqual(key, opts.definition as ForeignKeyIntrospection);
}
