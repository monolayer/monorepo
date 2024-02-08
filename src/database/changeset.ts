import microdiff from "microdiff";
import { Changeset } from "./migration_op/changeset.js";
import { migrationOp } from "./migration_op/compute.js";
import { CreateTableDiff, isCreateTable } from "./migration_op/table/create.js";
import { DropTableTableDiff, isDropTable } from "./migration_op/table/drop.js";
import type { MigrationSchema } from "./migrations/migration_schema.js";

export function changeset(
	local: MigrationSchema,
	remote: MigrationSchema,
): Changeset[] {
	const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
	return diff
		.flatMap((difference) =>
			migrationOp(difference, addedTables, droppedTables, local, remote),
		)
		.sort((a, b) => (a.priority || 1) - (b.priority || 1));
}

export function changesetDiff(local: MigrationSchema, remote: MigrationSchema) {
	const diff = microdiff(remote, local);
	const addedTables = diff.filter(isCreateTable).map(tableName);
	const droppedTables = diff.filter(isDropTable).map(tableName);
	return {
		diff,
		addedTables,
		droppedTables,
	};
}

export type DbChangeset = Record<string, Changeset[]>;

function tableName(diff: CreateTableDiff | DropTableTableDiff) {
	return diff.path[1];
}
