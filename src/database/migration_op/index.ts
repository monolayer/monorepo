import type { Difference } from "microdiff";
import { ChangeSetType, type Changeset } from "./changeset.js";
import { MigrationOpPriority } from "./priority.js";

export type CreateFirstIndexDiff = {
	type: "CREATE";
	path: ["index", string];
	value: Record<string, string>;
};

export function isCreateFirstIndex(
	test: Difference,
): test is CreateFirstIndexDiff {
	return (
		test.type === "CREATE" && test.path[0] === "index" && test.path.length === 2
	);
}

export type ChangeIndexDiff = {
	type: "CHANGE";
	path: ["index", string, string];
	value: string;
	oldValue: string;
};

export function isChangeIndex(
	differece: Difference,
): differece is ChangeIndexDiff {
	return (
		differece.type === "CHANGE" &&
		differece.path[0] === "index" &&
		differece.path.length === 3 &&
		typeof differece.value === "string" &&
		typeof differece.oldValue === "string" &&
		differece.value.split(":")[0] !== differece.oldValue.split(":")[0]
	);
}

export type DropAllIndexesDiff = {
	type: "REMOVE";
	path: ["index", string];
	oldValue: Record<string, string>;
};

export function isDropAllIndexes(test: Difference): test is DropAllIndexesDiff {
	return (
		test.type === "REMOVE" && test.path[0] === "index" && test.path.length === 2
	);
}

export function createFirstIndexMigration(
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
					priority: MigrationOpPriority.Index,
					tableName: tableName,
					type: ChangeSetType.CreateIndex,
					up: [
						`await sql\`${index[1]};COMMENT ON INDEX ${indexName} IS '${index[0]}'\`.execute(db);`,
					],
					down: addedTables.includes(tableName)
						? []
						: [`await db.schema.dropIndex("${indexName}").execute();`],
				};
				return changeSet;
			}
		})
		.filter((x): x is Changeset => x !== undefined);
}

export function dropAllIndexesMigration(
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
				priority: MigrationOpPriority.Index,
				tableName: tableName,
				type: ChangeSetType.DropIndex,
				up: droppedTables.includes(tableName)
					? []
					: [`await db.schema.dropIndex("${indexName}").execute();`],
				down: [
					`await sql\`${index[1]};COMMENT ON INDEX ${indexName} IS '${index[0]}'\`.execute(db);`,
				],
			};
			return changeSet;
		})
		.filter((x): x is Changeset => x !== undefined);
}

export function changeIndexMigration(diff: ChangeIndexDiff) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const oldIndex = diff.oldValue.split(":");
	const newIndex = diff.value.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeIndex,
		tableName: tableName,
		type: ChangeSetType.ChangeIndex,
		up: [
			`await sql\`DROP INDEX ${indexName};${newIndex[1]};COMMENT ON INDEX ${indexName} IS '${newIndex[0]}'\`.execute(db);`,
		],
		down: [
			`await sql\`DROP INDEX ${indexName};${oldIndex[1]};COMMENT ON INDEX ${indexName} IS '${oldIndex[0]}'\`.execute(db);`,
		],
	};
	return changeset;
}
