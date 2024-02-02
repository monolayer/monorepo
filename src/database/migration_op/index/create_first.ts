import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/changeset.js";
import { MigrationOpPriority } from "../compute.js";

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
