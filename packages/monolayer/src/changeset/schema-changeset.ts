import microdiff, { type Difference } from "microdiff";
import type { CamelCaseOptions } from "~/configuration.js";
import type {
	ColumnsToRename,
	SchemaIntrospection,
	TablesToRename,
} from "~/introspection/introspect-schemas.js";
import { type SchemaMigrationInfo } from "~/introspection/introspection.js";
import {
	isCreateTable,
	isDropTable,
	type CreateTableDiff,
	type DropTableTableDiff,
} from "../database/schema/table/changeset.js";
import { migrationOpGenerators } from "./generators.js";
import { toSnakeCase } from "./helpers.js";
import { Changeset } from "./types.js";

interface Generator {
	(
		diff: Difference,
		context: GeneratorContext,
	): Changeset | Changeset[] | undefined;
}

export interface GeneratorContext {
	local: SchemaMigrationInfo;
	db: SchemaMigrationInfo;
	addedTables: string[];
	droppedTables: string[];
	schemaName: string;
	camelCaseOptions: CamelCaseOptions;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
}

export function schemaChangeset(
	introspection: SchemaIntrospection,
	camelCaseOptions: CamelCaseOptions,
	generators: Generator[] = migrationOpGenerators,
): Changeset[] {
	const { diff, addedTables, droppedTables } = changesetDiff(
		{
			...introspection.local,
			tablePriorities: [],
		},
		{
			...introspection.remote,
			tablePriorities: [],
		},
	);
	const context: GeneratorContext = {
		local: introspection.local,
		db: introspection.remote,
		addedTables: addedTables,
		droppedTables: droppedTables,
		schemaName: toSnakeCase(introspection.schemaName, camelCaseOptions),
		camelCaseOptions,
		tablesToRename: introspection.tablesToRename,
		columnsToRename: introspection.columnsToRename,
	};

	const changesets = diff.flatMap((difference) => {
		for (const generator of generators) {
			const op = generator(difference, context);
			if (op !== undefined) return op;
		}
		return [];
	});
	return sortChangeset(changesets, introspection);
}

export function changesetDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const diff = microdiff(remote, local);
	const tableName = (diff: CreateTableDiff | DropTableTableDiff) =>
		diff.path[1];
	const addedTables = diff.filter(isCreateTable).map(tableName);
	const droppedTables = diff.filter(isDropTable).map(tableName);
	return {
		diff,
		addedTables,
		droppedTables,
	};
}

function sortChangeset(
	changeset: Changeset[],
	introspection: SchemaIntrospection,
) {
	const tableOrderIndex = introspection.tablePriorities.reduce(
		(acc, name, index) => {
			acc[name] = index;
			return acc;
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{} as Record<string, any>,
	);

	return changeset
		.sort((a, b) => (a.priority || 1) - (b.priority || 1))
		.sort((a, b) => {
			if (a.type === "createTable" || a.type === "dropTable") {
				const indexA = introspection.tablePriorities.includes(a.tableName)
					? tableOrderIndex[a.tableName]
					: -changeset.length;
				const indexB = introspection.tablePriorities.includes(b.tableName)
					? tableOrderIndex[b.tableName]
					: -changeset.length;
				return indexA - indexB;
			}
			return 1 - 1;
		});
}
