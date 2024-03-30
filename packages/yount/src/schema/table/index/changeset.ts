import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../../introspection/introspection.js";

export function indexMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
) {
	if (isCreateFirstIndex(diff)) {
		return createFirstIndexMigration(diff, addedTables);
	}
	if (isDropAllIndexes(diff)) {
		return dropAllIndexesMigration(diff, droppedTables);
	}
	if (isChangeIndex(diff)) {
		return changeIndexMigration(diff);
	}
	if (isCreateIndex(diff)) {
		return createIndexMigration(diff);
	}
	if (isDropIndex(diff)) {
		return dropIndexMigration(diff);
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

type ChangeIndexDiff = {
	type: "CHANGE";
	path: ["index", string, string];
	value: string;
	oldValue: string;
};

function isChangeIndex(differece: Difference): differece is ChangeIndexDiff {
	return (
		differece.type === "CHANGE" &&
		differece.path[0] === "index" &&
		differece.path.length === 3 &&
		typeof differece.value === "string" &&
		typeof differece.oldValue === "string" &&
		differece.value.split(":")[0] !== differece.oldValue.split(":")[0]
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
						[
							`await sql\`${index[1]};COMMENT ON INDEX "${indexName}" IS '${index[0]}'\`.execute(db);`,
						],
					],
					down: addedTables.includes(tableName)
						? [[]]
						: [[`await db.schema.dropIndex("${indexName}").execute();`]],
				};
				return changeSet;
			}
		})
		.filter((x): x is Changeset => x !== undefined);
}

function dropAllIndexesMigration(
	diff: DropAllIndexesDiff,
	droppedTables: string[],
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
					: [[`await db.schema.dropIndex("${indexName}").execute();`]],
				down: [
					[
						`await sql\`${index[1]};COMMENT ON INDEX "${indexName}" IS '${index[0]}'\`.execute(db);`,
					],
				],
			};
			return changeSet;
		})
		.filter((x): x is Changeset => x !== undefined);
}

function changeIndexMigration(diff: ChangeIndexDiff) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const oldIndex = diff.oldValue.split(":");
	const newIndex = diff.value.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeIndex,
		tableName: tableName,
		type: ChangeSetType.ChangeIndex,
		up: [
			[
				`await sql\`DROP INDEX "${indexName}";${newIndex[1]};COMMENT ON INDEX "${indexName}" IS '${newIndex[0]}'\`.execute(db);`,
			],
		],
		down: [
			[
				`await sql\`DROP INDEX "${indexName}";${oldIndex[1]};COMMENT ON INDEX "${indexName}" IS '${oldIndex[0]}'\`.execute(db);`,
			],
		],
	};
	return changeset;
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

function createIndexMigration(diff: CreateIndex) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const index = diff.value.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexCreate,
		tableName: tableName,
		type: ChangeSetType.CreateIndex,
		up: [
			[
				`await sql\`${index[1]};COMMENT ON INDEX "${indexName}" IS '${index[0]}'\`.execute(db);`,
			],
		],
		down: [[`await db.schema.dropIndex("${indexName}").execute();`]],
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

function dropIndexMigration(diff: DropIndex) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const index = diff.oldValue.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexDrop,
		tableName: tableName,
		type: ChangeSetType.DropIndex,
		up: [[`await db.schema.dropIndex("${indexName}").execute();`]],
		down: [
			[
				`await sql\`${index[1]};COMMENT ON INDEX "${indexName}" IS '${index[0]}'\`.execute(db);`,
			],
		],
	};
	return changeset;
}
