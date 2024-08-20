/* eslint-disable max-lines */
import { gen } from "effect/Effect";
import type { Difference } from "microdiff";
import { ChangesetGeneratorState } from "~pg/changeset/changeset-generator.js";
import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
	tableStructureHasChanged,
} from "~pg/changeset/helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import {
	indexNameFromDefinition,
	rehashIndex,
} from "~pg/introspection/index.js";
import {
	currentTableName,
	previousTableName,
} from "~pg/introspection/introspection/table-name.js";
import type { TablesToRename } from "~pg/introspection/schema.js";

export function indexMigrationOpGenerator(diff: Difference) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
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
			return changeIndexNameMigration(diff, context);
		}
		if (isRehashIndex(diff)) {
			return rehashIndexMigration(diff, context);
		}
	});
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
	{
		schemaName,
		addedTables,
		tablesToRename,
		columnsToRename,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	return Object.entries(diff.value).reduce((acc, [indexHash, index]) => {
		const redefinedIndex = rehashIndex(tableName, index, indexHash);
		const indexOnTableCreation = addedTables.includes(tableName);
		const changeSet: Changeset = {
			priority: MigrationOpPriority.IndexCreate,
			phase: tableStructureHasChanged(
				tableName,
				schemaName,
				tablesToRename,
				columnsToRename,
			)
				? ChangesetPhase.Alter
				: ChangesetPhase.Expand,
			schemaName,
			tableName: tableName,
			currentTableName: currentTableName(tableName, tablesToRename, schemaName),
			type: ChangesetType.CreateIndex,
			up: [
				indexOnTableCreation
					? executeKyselyDbStatement(`${redefinedIndex.definition}`)
					: concurrentIndex(
							schemaName,
							redefinedIndex.name,
							redefinedIndex.definition,
						),
			],
			down: addedTables.includes(tableName)
				? [[]]
				: [
						executeKyselySchemaStatement(
							schemaName,
							`dropIndex("${redefinedIndex.name}")`,
							"ifExists()",
						),
					],
		};
		if (!indexOnTableCreation) {
			changeSet.transaction = false;
		}
		acc.push(changeSet);
		return acc;
	}, [] as Changeset[]);
}

function dropAllIndexesMigration(
	diff: DropAllIndexesDiff,
	{
		schemaName,
		droppedTables,
		tablesToRename,
		columnsToRename,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	const indexHashes = Object.keys(diff.oldValue) as Array<
		keyof typeof diff.oldValue
	>;
	return indexHashes
		.flatMap((indexHash) => {
			const indexTableName = previousTableName(tableName, tablesToRename);
			const indexName = `${indexTableName}_${indexHash}_monolayer_idx`;
			const changeSet: Changeset = {
				priority: MigrationOpPriority.IndexDrop,
				phase: tableStructureHasChanged(
					tableName,
					schemaName,
					tablesToRename,
					columnsToRename,
				)
					? ChangesetPhase.Alter
					: ChangesetPhase.Contract,
				schemaName,
				tableName: indexTableName,
				currentTableName: currentTableName(
					tableName,
					tablesToRename,
					schemaName,
				),
				type: ChangesetType.DropIndex,
				up: droppedTables.includes(tableName)
					? [[]]
					: [
							executeKyselyDbStatement(
								`DROP INDEX CONCURRENTLY IF EXISTS "${schemaName}"."${indexName}"`,
							),
						],
				down: [executeKyselyDbStatement(`${diff.oldValue[indexHash]}`)],
			};
			if (!droppedTables.includes(tableName)) {
				changeSet.transaction = false;
			}
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
	{
		schemaName,
		tablesToRename,
		addedTables,
		columnsToRename,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	const hash = diff.path[2];
	const indexName = `${tableName}_${hash}_monolayer_idx`;
	const index = diff.value;
	const indexOnTableCreation = addedTables.includes(tableName);

	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexCreate,
		phase: tableStructureHasChanged(
			tableName,
			schemaName,
			tablesToRename,
			columnsToRename,
		)
			? ChangesetPhase.Alter
			: ChangesetPhase.Expand,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.CreateIndex,
		up: [
			indexOnTableCreation
				? executeKyselyDbStatement(`${index}`)
				: concurrentIndex(schemaName, indexName, index),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`dropIndex("${indexName}")`,
				"ifExists()",
			),
		],
	};
	if (!indexOnTableCreation) {
		changeset.transaction = false;
	}

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

function dropIndexMigration(
	diff: DropIndex,
	{ schemaName, tablesToRename, columnsToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const hash = diff.path[2];
	const indexName = `${tableName}_${hash}_monolayer_idx`;
	const index = diff.oldValue;

	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexDrop,
		phase: tableStructureHasChanged(
			tableName,
			schemaName,
			tablesToRename,
			columnsToRename,
		)
			? ChangesetPhase.Alter
			: ChangesetPhase.Contract,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.DropIndex,
		transaction: false,
		up: [
			executeKyselyDbStatement(
				`DROP INDEX CONCURRENTLY IF EXISTS "${schemaName}"."${indexName}"`,
			),
		],
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

function changeIndexNameMigration(
	diff: ChangeIndexNameDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const oldIndexName = indexNameFromDefinition(diff.oldValue);
	const newIndexName = rehashIndex(tableName, diff.value, diff.path[2]).name;
	return changeIndexNameChangeset(
		tableName,
		newIndexName,
		oldIndexName!,
		schemaName,
		tablesToRename,
	);
}

export type RehashIndexDiff = {
	type: "CHANGE";
	path: ["index", string, string];
	value: string;
	oldValue: string;
};

function isRehashIndex(test: Difference): test is RehashIndexDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "index" &&
		test.path.length === 3 &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string" &&
		indexNameFromDefinition(test.value) !==
			rehashIndex(test.path[1], test.value, test.path[2]).name
	);
}

function rehashIndexMigration(
	diff: RehashIndexDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const oldIndexName = indexNameFromDefinition(diff.oldValue);
	const newIndexName = rehashIndex(tableName, diff.value, diff.path[2]).name;
	return changeIndexNameChangeset(
		tableName,
		newIndexName,
		oldIndexName!,
		schemaName,
		tablesToRename,
	);
}

function changeIndexNameChangeset(
	tableName: string,
	newIndexName: string,
	oldIndexName: string,
	schemaName: string,
	tablesToRename: TablesToRename,
) {
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeIndex,
		phase: ChangesetPhase.Alter,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.RenameIndex,
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

export function concurrentIndex(
	schenaName: string,
	indexName: string,
	definition: string,
) {
	const concurrentIndexDefinition = definition.replace(
		`index "${indexName}"`,
		`index concurrently "${indexName}"`,
	);
	const createIndex = `try {
    await sql\`\${sql.raw('${concurrentIndexDefinition.replace(/'/g, "\\'")}')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("${schenaName}").schema.dropIndex("${indexName}").ifExists().execute();
    }
    throw error;
  }`;

	return [createIndex];
}
