/* eslint-disable max-lines */
import {
	type ColumnsToRename,
	type TablesToRename,
} from "@monorepo/pg/introspection/schema.js";
import type { AnySchema } from "@monorepo/pg/schema/schema.js";
import type { TypeAlignment } from "@monorepo/programs/introspect/alignment.js";
import { gen } from "effect/Effect";
import microdiff, { type Difference } from "microdiff";
import { toSnakeCase } from "~push/changeset/introspection.js";
import { type CodeChangeset } from "~push/changeset/types/changeset.js";
import {
	byCreateColumn,
	byCreateTableDiff,
	byDropColumn,
	byDropTableDiff,
} from "~push/changeset/types/diff.js";
import type { SchemaMigrationInfo } from "~push/changeset/types/schema.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { MigrationOpsGeneratorsState } from "~push/state/migration-ops-generators.js";

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
};

export function schemaChangeset(
	introspection: SchemaIntrospection,
	camelCase: boolean,
	debug: boolean,
	typeAlignments: TypeAlignment[],
) {
	return gen(function* () {
		const { diff, addedTables, droppedTables, addedColumns, droppedColumns } =
			changesetDiff(
				{
					...introspection.local,
					tablePriorities: [],
					foreignKeyDefinitions: {},
					schemaInfo: {},
				},
				{
					...introspection.remote,
					tablePriorities: [],
					foreignKeyDefinitions: {},
					schemaInfo: {},
				},
			);
		const addTableGrouped = diff.reduce<Difference[]>((acc, d) => {
			if (
				d.type === "CREATE" &&
				d.path[0] === "table" &&
				d.path[1] !== undefined &&
				typeof d.path[1] === "string" &&
				addedTables.includes(d.path[1])
			) {
				d.value = {
					...d.value,
					primaryKey: tablePrimaryKeyDiff(d.path[1], diff, "CREATE"),
					checkConstraints: tableCheckConstraintDiff(d.path[1], diff, "CREATE"),
					uniqueConstraints: tableUniqueConstraintDiff(
						d.path[1],
						diff,
						"CREATE",
					),
					foreignKeys: tableForeignKeyDiff(d.path[1], diff, "CREATE"),
				};
				acc.push(d);
			}
			return acc;
		}, []);

		yield* ChangesetGeneratorState.update({
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
			debug,
		});

		let changesets: CodeChangeset[] = [];
		const generators = yield* MigrationOpsGeneratorsState.current;

		const filtered = diff.reduce<Difference[]>((acc, d) => {
			if (
				d.type === "CREATE" &&
				(d.path[0] === "table" ||
					d.path[0] === "foreignKeyConstraints" ||
					d.path[0] === "checkConstraints" ||
					d.path[0] === "primaryKey" ||
					d.path[0] === "uniqueConstraints") &&
				addedTables.includes(String(d.path[1]))
			) {
				return acc;
			} else {
				acc.push(d);
				return acc;
			}
		}, []);

		filtered.push(...addTableGrouped);
		for (const difference of filtered) {
			for (const generator of generators) {
				const op = yield* generator(difference);
				if (op !== undefined) {
					if (Array.isArray(op)) {
						changesets = [...changesets, ...op];
					} else {
						if (Object.keys(op).length !== 0) {
							changesets = [...changesets, ...[op]];
						}
					}
				}
			}
		}
		const sorted = sortChangeset([...changesets], introspection);
		return sorted;
	});
}

export function changesetDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const diff = microdiff(remote, local);
	return {
		diff,
		addedTables: diff.filter(byCreateTableDiff).map((diff) => diff.path[1]),
		droppedTables: diff.filter(byDropTableDiff).map((diff) => diff.path[1]),
		addedColumns: addedColumns(diff),
		droppedColumns: droppedColumns(diff),
	};
}

function addedColumns(diff: Difference[]) {
	return diff
		.filter((diff) => byCreateColumn(diff))
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
		.filter(byDropColumn)
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

export function sortChangeset(
	changeset: CodeChangeset[],
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
			if (a.type === "createTable") {
				const indexA = introspection.tablePriorities.includes(a.tableName)
					? tableOrderIndex[a.tableName]
					: -changeset.length;
				const indexB = introspection.tablePriorities.includes(b.tableName)
					? tableOrderIndex[b.tableName]
					: -changeset.length;
				return indexA - indexB;
			}
			return 1 - 1;
		})
		.sort((a, b) => {
			if (a.type === "dropTable" || b.type === "dropTable") {
				const indexA = introspection.tablePriorities.includes(b.tableName)
					? tableOrderIndex[b.tableName]
					: -changeset.length;
				const indexB = introspection.tablePriorities.includes(a.tableName)
					? tableOrderIndex[a.tableName]
					: -changeset.length;
				return indexA - indexB;
			}
			return 1 - 1;
		});
}

function filterDiffByCreate(diff: Difference[]) {
	return diff.filter((d) => d.type === "CREATE");
}

function filterDiffByRemove(diff: Difference[]) {
	return diff.filter((d) => d.type === "REMOVE");
}

function tablePrimaryKeyDiff(
	tableName: string,
	diff: Difference[],
	type: "CREATE" | "REMOVE",
) {
	switch (type) {
		case "CREATE":
			return filterDiffByCreate(diff).find(
				(d) =>
					d.type === "CREATE" &&
					d.path[0] === "primaryKey" &&
					d.path[1] === tableName,
			)?.value;
		case "REMOVE":
			return filterDiffByRemove(diff).find(
				(d) =>
					d.type === "REMOVE" &&
					d.path[0] === "primaryKey" &&
					d.path[1] === tableName,
			)?.oldValue;
	}
}

function tableCheckConstraintDiff(
	tableName: string,
	diff: Difference[],
	type: "CREATE" | "REMOVE",
) {
	switch (type) {
		case "CREATE":
			return filterDiffByCreate(diff).find(
				(d) =>
					d.type === "CREATE" &&
					d.path[0] === "checkConstraints" &&
					d.path[1] === tableName,
			)?.value;
		case "REMOVE":
			return filterDiffByRemove(diff).find(
				(d) =>
					d.type === "REMOVE" &&
					d.path[0] === "checkConstraints" &&
					d.path[1] === tableName,
			)?.oldValue;
	}
}

function tableForeignKeyDiff(
	tableName: string,
	diff: Difference[],
	type: "CREATE" | "REMOVE",
) {
	switch (type) {
		case "CREATE":
			return filterDiffByCreate(diff).find(
				(d) =>
					d.type === "CREATE" &&
					d.path[0] === "foreignKeyConstraints" &&
					d.path[1] === tableName,
			)?.value;
		case "REMOVE":
			return filterDiffByRemove(diff).find(
				(d) =>
					d.type === "REMOVE" &&
					d.path[0] === "foreignKeyConstraints" &&
					d.path[1] === tableName,
			)?.oldValue;
	}
}

function tableUniqueConstraintDiff(
	tableName: string,
	diff: Difference[],
	type: "CREATE" | "REMOVE",
) {
	switch (type) {
		case "CREATE":
			return filterDiffByCreate(diff).find(
				(d) =>
					d.type === "CREATE" &&
					d.path[0] === "uniqueConstraints" &&
					d.path[1] === tableName,
			)?.value;
		case "REMOVE":
			return filterDiffByRemove(diff).find(
				(d) =>
					d.type === "REMOVE" &&
					d.path[0] === "uniqueConstraints" &&
					d.path[1] === tableName,
			)?.oldValue;
	}
}
