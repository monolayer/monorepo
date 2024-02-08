import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import { MigrationOpPriority } from "../priority.js";

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
