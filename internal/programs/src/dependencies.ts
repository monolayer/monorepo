import { currentTableName } from "@monorepo/pg/introspection/introspection/table-name.js";
import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import { reduce, union } from "effect/Array";

export type TableDependencies = {
	foreigh_key_table: string;
	primary_key_table: string;
}[];

export function sortTableDependencies(
	databaseTableDependencies: string[],
	localTableDependencies: string[],
	tablesToRename: TablesToRename,
	schemaName: string,
) {
	return reduce<string, string[]>(
		union(databaseTableDependencies, localTableDependencies),
		[],
		(acc, node) => {
			acc.push(node);
			const tableName = currentTableName(node, tablesToRename, schemaName);
			if (tableName !== node) acc.push(tableName);
			return acc;
		},
	);
}
