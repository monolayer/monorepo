import microdiff from "microdiff";
import { DbTableInfo, LocalTableInfo } from "./introspection/types.js";
import { migrationOp } from "./migration_op/compute.js";
import { isCreateTable } from "./migration_op/table/create.js";
import { isDropTable } from "./migration_op/table/drop.js";

export function changeset(local: LocalTableInfo, db: DbTableInfo): Changeset[] {
	const diff = microdiff(db, local);
	const droppedTables = diff.filter(isDropTable).map((diff) => diff.path[1]);
	const addedTables = diff.filter(isCreateTable).map((diff) => diff.path[1]);
	const changeset = diff.flatMap((diff) =>
		migrationOp(diff, addedTables, droppedTables),
	);
	return changeset.sort((a, b) => (a.priority || 1) - (b.priority || 1));
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
	priority?: number;
};
