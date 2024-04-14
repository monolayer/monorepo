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
	const indexHashes = Object.keys(diff.value) as Array<keyof typeof diff.value>;
	return indexHashes
		.flatMap((indexHash) => {
			const index = diff.value[indexHash]?.split(":");
			const indexName = `${tableName}_${indexHash}_yount_idx`;
			if (index !== undefined) {
				const changeSet: Changeset = {
					priority: MigrationOpPriority.IndexCreate,
					tableName: tableName,
					type: ChangeSetType.CreateIndex,
					up: [executeKyselyDbStatement(`${index[0]}`)],
					down: addedTables.includes(tableName)
						? [[]]
						: [
								executeKyselySchemaStatement(
									schemaName,
									`dropIndex("${indexName}")`,
								),
							],
				};
				return changeSet;
			}
		})
		.filter((x): x is Changeset => x !== undefined);
}

function dropAllIndexesMigration(
	diff: DropAllIndexesDiff,
	{ schemaName, droppedTables }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const indexHashes = Object.keys(diff.oldValue) as Array<
		keyof typeof diff.oldValue
	>;
	return indexHashes
		.flatMap((indexHash) => {
			const index = diff.oldValue[indexHash]?.split(":");
			if (index === undefined) return;
			const changeSet: Changeset = {
				priority: MigrationOpPriority.IndexDrop,
				tableName: tableName,
				type: ChangeSetType.DropIndex,
				up: droppedTables.includes(tableName)
					? [[]]
					: [
							executeKyselySchemaStatement(
								schemaName,
								`dropIndex("${indexHash}")`,
							),
						],
				down: [executeKyselyDbStatement(`${index[0]}`)],
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
