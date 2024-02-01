import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "../changeset.js";
import { MigrationOpPriority } from "./migration_op.js";

export function createIndexMigration(
	diff: CreateIndexDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.Index,
		tableName: tableName,
		type: ChangeSetType.CreateIndex,
		up: [`await sql\`${diff.value}\`.execute(db);`],
		down: addedTables.includes(tableName)
			? []
			: [`await db.schema.dropIndex("${indexName}").execute();`],
	};
	return changeset;
}

export function createFirstIndexMigration(
	diff: CreateFirstIndexDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	const indexNames = Object.keys(diff.value) as Array<keyof typeof diff.value>;
	return indexNames.map((indexName) => {
		const changeSet: Changeset = {
			priority: MigrationOpPriority.Index,
			tableName: tableName,
			type: ChangeSetType.CreateIndex,
			up: [`await sql\`${diff.value[indexName]}\`.execute(db);`],
			down: addedTables.includes(tableName)
				? []
				: [`await db.schema.dropIndex("${indexName}").execute();`],
		};
		return changeSet;
	});
}

export function dropIndexMigration(
	diff: DropIndexDiff,
	droppedTables: string[],
) {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.Index,
		tableName: tableName,
		type: ChangeSetType.DropIndex,
		up: droppedTables.includes(tableName)
			? []
			: [`await db.schema.dropIndex("${indexName}").execute();`],
		down: [`await sql\`${diff.oldValue}\`.execute(db);`],
	};
	return changeset;
}

export function dropAllIndexesMigration(
	diff: DropAllIndexesDiff,
	droppedTables: string[],
) {
	const tableName = diff.path[1];
	const indexNames = Object.keys(diff.oldValue) as Array<
		keyof typeof diff.oldValue
	>;
	return indexNames.map((indexName) => {
		const changeSet: Changeset = {
			priority: MigrationOpPriority.Index,
			tableName: tableName,
			type: ChangeSetType.DropIndex,
			up: droppedTables.includes(tableName)
				? []
				: [`await db.schema.dropIndex("${indexName}").execute();`],
			down: [`await sql\`${diff.oldValue[indexName]}\`.execute(db);`],
		};
		return changeSet;
	});
}

export type CreateIndexDiff = {
	type: "CREATE";
	path: ["index", string, string];
	value: string;
};

export function isCreateIndex(test: Difference): test is CreateIndexDiff {
	return (
		test.type === "CREATE" && test.path[0] === "index" && test.path.length === 3
	);
}

export type DropIndexDiff = {
	type: "REMOVE";
	path: ["index", string, string];
	oldValue: string;
};

export function isDropIndex(test: Difference): test is DropIndexDiff {
	return (
		test.type === "REMOVE" && test.path.length === 3 && test.path[0] === "index"
	);
}

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
