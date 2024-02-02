import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/changeset.js";
import { MigrationOpPriority } from "../compute.js";

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
