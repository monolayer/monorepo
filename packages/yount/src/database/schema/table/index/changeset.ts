import type { Difference } from "microdiff";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "~/changeset/helpers.js";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { changedColumnNames } from "~/introspection/column-name.js";
import { previousTableName } from "~/introspection/table-name.js";
import { indexNameFromDefinition, rehashIndex } from "./introspection.js";

export function indexMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isCreateFirstIndex(diff)) {
		return createFirstIndexMigration(diff, context);
	}
	if (isDropAllIndexes(diff)) {
		return dropAllIndexesMigration(diff, context);
	}
	if (isCreateIndex(diff)) {
		return createIndexMigration(diff, context);
	}
	if (isDropIndex(diff)) {
		return dropIndexMigration(diff, context);
	}
	if (isChangeIndexName(diff)) {
		return changeIndexNameMigration(diff);
	}
	if (isRehashIndex(diff, context)) {
		return rehashIndexMigration(diff);
	}
}

type CreateFirstIndexDiff = {
	type: "CREATE";
	path: ["index", string];
	value: Record<string, string>;
};

function isCreateFirstIndex(test: Difference): test is CreateFirstIndexDiff {
	return (
		test.type === "CREATE" && test.path[0] === "index" && test.path.length === 2
	);
}

type DropAllIndexesDiff = {
	type: "REMOVE";
	path: ["index", string];
	oldValue: Record<string, string>;
};

function isDropAllIndexes(test: Difference): test is DropAllIndexesDiff {
	return (
		test.type === "REMOVE" && test.path[0] === "index" && test.path.length === 2
	);
}

function createFirstIndexMigration(
	diff: CreateFirstIndexDiff,
	{ schemaName, addedTables }: GeneratorContext,
) {
	const tableName = diff.path[1];
	return Object.entries(diff.value).reduce((acc, [indexHash, index]) => {
		const redefinedIndex = rehashIndex(tableName, index, indexHash);
		const changeSet: Changeset = {
			priority: MigrationOpPriority.IndexCreate,
			tableName: tableName,
			type: ChangeSetType.CreateIndex,
			up: [executeKyselyDbStatement(`${redefinedIndex.definition}`)],
			down: addedTables.includes(tableName)
				? [[]]
				: [
						executeKyselySchemaStatement(
							schemaName,
							`dropIndex("${redefinedIndex.name}")`,
						),
					],
		};
		acc.push(changeSet);
		return acc;
	}, [] as Changeset[]);
}

function dropAllIndexesMigration(
	diff: DropAllIndexesDiff,
	{ schemaName, droppedTables, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const indexHashes = Object.keys(diff.oldValue) as Array<
		keyof typeof diff.oldValue
	>;
	return indexHashes
		.flatMap((indexHash) => {
			const indexTableName = previousTableName(tableName, tablesToRename);
			const indexName = `${indexTableName}_${indexHash}_yount_idx`;
			const changeSet: Changeset = {
				priority: MigrationOpPriority.IndexDrop,
				tableName: indexTableName,
				type: ChangeSetType.DropIndex,
				up: droppedTables.includes(tableName)
					? [[]]
					: [
							executeKyselySchemaStatement(
								schemaName,
								`dropIndex("${indexName}")`,
							),
						],
				down: [executeKyselyDbStatement(`${diff.oldValue[indexHash]}`)],
			};
			return changeSet;
		})
		.filter((x): x is Changeset => x !== undefined);
}

type CreateIndex = {
	type: "CREATE";
	path: ["index", string, string];
	value: string;
};

function isCreateIndex(test: Difference): test is CreateIndex {
	return (
		test.type === "CREATE" &&
		test.path[0] === "index" &&
		test.path.length === 3 &&
		typeof test.value === "string"
	);
}

function createIndexMigration(
	diff: CreateIndex,
	{ schemaName }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const hash = diff.path[2];
	const indexName = `${tableName}_${hash}_yount_idx`;
	const index = diff.value;
	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexCreate,
		tableName: tableName,
		type: ChangeSetType.CreateIndex,
		up: [executeKyselyDbStatement(`${index}`)],
		down: [
			executeKyselySchemaStatement(schemaName, `dropIndex("${indexName}")`),
		],
	};
	return changeset;
}

type DropIndex = {
	type: "REMOVE";
	path: ["index", string, string];
	oldValue: string;
};

function isDropIndex(test: Difference): test is DropIndex {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "index" &&
		test.path.length === 3 &&
		typeof test.oldValue === "string"
	);
}

function dropIndexMigration(diff: DropIndex, { schemaName }: GeneratorContext) {
	const tableName = diff.path[1];
	const hash = diff.path[2];
	const indexName = `${tableName}_${hash}_yount_idx`;
	const index = diff.oldValue;
	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexDrop,
		tableName: tableName,
		type: ChangeSetType.DropIndex,
		up: [executeKyselySchemaStatement(schemaName, `dropIndex("${indexName}")`)],
		down: [executeKyselyDbStatement(`${index}`)],
	};
	return changeset;
}

export type ChangeIndexNameDiff = {
	type: "CHANGE";
	path: ["index", string, string];
	value: string;
	oldValue: string;
};

function isChangeIndexName(test: Difference): test is ChangeIndexNameDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "index" &&
		test.path.length === 3 &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string" &&
		indexNameFromDefinition(test.value) !==
			indexNameFromDefinition(test.oldValue)
	);
}

function changeIndexNameMigration(diff: ChangeIndexNameDiff) {
	const tableName = diff.path[1];
	const oldIndexName = indexNameFromDefinition(diff.oldValue);
	const newIndexName = rehashIndex(tableName, diff.value, diff.path[2]).name;
	return changeIndexNameChangeset(tableName, newIndexName, oldIndexName!);
}

export type RehashIndexDiff = {
	type: "CHANGE";
	path: ["index", string, string];
	value: string;
	oldValue: string;
};

function isRehashIndex(
	test: Difference,
	context: GeneratorContext,
): test is RehashIndexDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "index" &&
		test.path.length === 3 &&
		typeof test.path[1] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string" &&
		indexNameFromDefinition(test.value) ===
			indexNameFromDefinition(test.oldValue) &&
		changedColumnNames(test.path[1], context.columnsToRename).length > 0
	);
}

function rehashIndexMigration(diff: RehashIndexDiff) {
	const tableName = diff.path[1];
	const oldIndexName = indexNameFromDefinition(diff.oldValue);
	const newIndexName = rehashIndex(tableName, diff.value, diff.path[2]).name;
	return changeIndexNameChangeset(tableName, newIndexName, oldIndexName!);
}

function changeIndexNameChangeset(
	tableName: string,
	newIndexName: string,
	oldIndexName: string,
) {
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeIndex,
		tableName: tableName,
		type: ChangeSetType.ChangeIndex,
		up: [
			executeKyselyDbStatement(
				`ALTER INDEX ${oldIndexName} RENAME TO ${newIndexName}`,
			),
		],
		down: [
			executeKyselyDbStatement(
				`ALTER INDEX ${newIndexName} RENAME TO ${oldIndexName}`,
			),
		],
	};
	return changeset;
}
