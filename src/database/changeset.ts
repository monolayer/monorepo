import microdiff from "microdiff";
import { migrationOp } from "./migration_op/compute.js";
import { CreateTableDiff, isCreateTable } from "./migration_op/table/create.js";
import { DropTableTableDiff, isDropTable } from "./migration_op/table/drop.js";
import type { MigrationSchema } from "./migrations/migration_schema.js";

export function changeset(
	local: MigrationSchema,
	remote: MigrationSchema,
): Changeset[] {
	const diff = microdiff(remote, local);
	const addedTables = diff.filter(isCreateTable).map(tableName);
	const droppedTables = diff.filter(isDropTable).map(tableName);
	return diff
		.flatMap((difference) =>
			migrationOp(difference, addedTables, droppedTables, local, remote),
		)
		.sort((a, b) => (a.priority || 1) - (b.priority || 1));
}

export type DbChangeset = Record<string, Changeset[]>;

export enum ChangeSetType {
	CreateTable = "createTable",
	DropTable = "dropTable",
	CreateColumn = "createColumn",
	DropColumn = "dropColumn",
	ChangeColumn = "changeColumn",
	ChangeTable = "changeTable",
	CreateIndex = "createIndex",
	DropIndex = "dropIndex",
}

export type Changeset = {
	tableName: string;
	type: ChangeSetType;
	up: string[];
	down: string[];
	priority: number;
};

function tableName(diff: CreateTableDiff | DropTableTableDiff) {
	return diff.path[1];
}
