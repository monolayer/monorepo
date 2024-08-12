import microdiff, { type Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/generator-context.js";
import { migrationOpGenerators } from "~/changeset/generators.js";
import { isCreateColumn, isDropColumn } from "~/changeset/generators/column.js";
import { isCreateTable, isDropTable } from "~/changeset/generators/table.js";
import type { TypeAlignment } from "~/changeset/helpers/alignment.js";
import {
	type SplitColumnRefactoring,
	splitRefactorChangesets,
} from "~/changeset/refactors/split-column.js";
import type { Changeset } from "~/changeset/types.js";
import { toSnakeCase } from "~/helpers/to-snake-case.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~/introspection/schema.js";
import type { SchemaMigrationInfo } from "~/schema/column/types.js";
import type { AnySchema } from "~/schema/schema.js";

interface Generator {
	(
		diff: Difference,
		context: GeneratorContext,
	): Changeset | Changeset[] | undefined;
}

export type SchemaIntrospection = {
	schema: AnySchema;
	allSchemas: AnySchema[];
	schemaName: string;
	local: SchemaMigrationInfo;
	remote: SchemaMigrationInfo;
	tableDiff: {
		added: string[];
		deleted: string[];
	};
	tablesToRename: TablesToRename;
	tablePriorities: string[];
	columnsToRename: ColumnsToRename;
	splitRefactors: SplitColumnRefactoring[];
};

export function schemaChangeset(
	introspection: SchemaIntrospection,
	camelCase: boolean,
	typeAlignments: TypeAlignment[],
	generators: Generator[] = migrationOpGenerators,
): Changeset[] {
	const { diff, addedTables, droppedTables, addedColumns, droppedColumns } =
		changesetDiff(
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
		addedTables,
		droppedTables,
		schemaName: toSnakeCase(introspection.schemaName, camelCase),
		camelCase: camelCase,
		tablesToRename: introspection.tablesToRename,
		columnsToRename: introspection.columnsToRename,
		typeAlignments: typeAlignments,
		addedColumns,
		droppedColumns,
		splitRefactors: introspection.splitRefactors,
	};

	const changesets = diff.flatMap((difference) => {
		for (const generator of generators) {
			const op = generator(difference, context);
			if (op !== undefined) return op;
		}
		return [];
	});
	return sortChangeset(
		[
			...changesets,
			...splitRefactorChangesets(introspection.splitRefactors, context),
		],
		introspection,
	);
}

export function changesetDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const diff = microdiff(remote, local);
	return {
		diff,
		addedTables: diff.filter(isCreateTable).map((diff) => diff.path[1]),
		droppedTables: diff.filter(isDropTable).map((diff) => diff.path[1]),
		addedColumns: addedColumns(diff),
		droppedColumns: droppedColumns(diff),
	};
}

function addedColumns(diff: Difference[]) {
	return diff
		.filter((diff) => isCreateColumn(diff))
		.map((diff) => [diff.path[1], diff.path[3]] as [string, string])
		.reduce(
			(acc, [table, column]) => {
				if (acc[table] === undefined) {
					acc[table] = [];
				}
				acc[table].push(column);
				return acc;
			},
			{} as Record<string, string[]>,
		);
}

function droppedColumns(diff: Difference[]) {
	return diff
		.filter(isDropColumn)
		.map((diff) => [diff.path[1], diff.path[3]] as [string, string])
		.reduce(
			(acc, [table, column]) => {
				if (acc[table] === undefined) {
					acc[table] = [];
				}
				acc[table].push(column);
				return acc;
			},
			{} as Record<string, string[]>,
		);
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
