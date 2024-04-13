import type { Difference } from "microdiff";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "~/changeset/helpers.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../../../introspection/introspection.js";

export function indexMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	schemaName: string,
) {
	if (isCreateFirstIndex(diff)) {
		return createFirstIndexMigration(diff, addedTables, schemaName);
	}
	if (isDropAllIndexes(diff)) {
		return dropAllIndexesMigration(diff, droppedTables, schemaName);
	}
	if (isCreateIndex(diff)) {
		return createIndexMigration(diff, schemaName);
	}
	if (isDropIndex(diff)) {
		return dropIndexMigration(diff, schemaName);
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
	addedTables: string[],
	schemaName: string,
) {
	const tableName = diff.path[1];
	const indexNames = Object.keys(diff.value) as Array<keyof typeof diff.value>;
	return indexNames
		.flatMap((indexName) => {
			const index = diff.value[indexName]?.split(":");
			if (index !== undefined) {
				const changeSet: Changeset = {
					priority: MigrationOpPriority.IndexCreate,
					tableName: tableName,
					type: ChangeSetType.CreateIndex,
					up: [
						executeKyselyDbStatement(`${index[1]}`),
						executeKyselyDbStatement(
							`COMMENT ON INDEX "${schemaName}"."${indexName}" IS '${index[0]}'`,
						),
					],
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
	droppedTables: string[],
	schemaName: string,
) {
	const tableName = diff.path[1];
	const indexNames = Object.keys(diff.oldValue) as Array<
		keyof typeof diff.oldValue
	>;
	return indexNames
		.flatMap((indexName) => {
			const index = diff.oldValue[indexName]?.split(":");
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
								`dropIndex("${indexName}")`,
							),
						],
				down: [
					executeKyselyDbStatement(`${index[1]}`),
					executeKyselyDbStatement(
						`COMMENT ON INDEX "public"."${indexName}" IS '${index[0]}'`,
					),
				],
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

function createIndexMigration(diff: CreateIndex, schemaName: string) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const index = diff.value.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexCreate,
		tableName: tableName,
		type: ChangeSetType.CreateIndex,
		up: [
			executeKyselyDbStatement(`${index[1]}`),
			executeKyselyDbStatement(
				`COMMENT ON INDEX "${schemaName}"."${indexName}" IS '${index[0]}'`,
			),
		],
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

function dropIndexMigration(diff: DropIndex, schemaName: string) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const index = diff.oldValue.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexDrop,
		tableName: tableName,
		type: ChangeSetType.DropIndex,
		up: [executeKyselySchemaStatement(schemaName, `dropIndex("${indexName}")`)],
		down: [
			executeKyselyDbStatement(`${index[1]}`),
			executeKyselyDbStatement(
				`COMMENT ON INDEX "${schemaName}"."${indexName}" IS '${index[0]}'`,
			),
		],
	};
	return changeset;
}
