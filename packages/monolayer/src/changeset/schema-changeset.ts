import microdiff, { type Difference } from "microdiff";
import type { CamelCaseOptions } from "~/configuration.js";
import type { TypeAlignment } from "~/database/alignment.js";
import type {
	ColumnsToRename,
	SchemaIntrospection,
	TablesToRename,
} from "~/introspection/introspect-schemas.js";
import { type SchemaMigrationInfo } from "~/introspection/introspection.js";
import {
	isCreateTable,
	isDropTable,
} from "../database/schema/table/changeset.js";
import {
	isCreateColumn,
	isDropColumn,
} from "../database/schema/table/column/changeset.js";
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
	typeAlignments: TypeAlignment[];
	addedColumns: Record<string, string[]>;
	droppedColumns: Record<string, string[]>;
}

export function schemaChangeset(
	introspection: SchemaIntrospection,
	camelCaseOptions: CamelCaseOptions,
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
		schemaName: toSnakeCase(introspection.schemaName, camelCaseOptions),
		camelCaseOptions,
		tablesToRename: introspection.tablesToRename,
		columnsToRename: introspection.columnsToRename,
		typeAlignments: typeAlignments,
		addedColumns,
		droppedColumns,
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
		.filter(isCreateColumn)
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
