import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import { MigrationOpPriority } from "../priority.js";

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
