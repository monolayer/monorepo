import { Difference } from "microdiff";
import { createColumnMigration, isCreateColumn } from "./column/create.js";
import { dropColumnMigration, isDropColumn } from "./column/drop.js";
import {
	columnDatatypeMigrationOperation,
	isColumnDataType,
} from "./column_change/data_type.js";
import {
	columnDefaultMigrationOperation,
	isColumnDefaultValue,
} from "./column_change/default.js";
import {
	addColumnForeignKeyMigrationOperation,
	isAddForeignKeyConstraintValue,
	isRemoveForeignKeyConstraintValue,
	removeColumnForeignKeyMigrationOperation,
} from "./column_change/foreign_key.js";
import {
	columnNullableMigrationOperation,
	isColumnNullable,
} from "./column_change/nullable.js";
import {
	columnPrimaryKeyMigrationOperation,
	isColumnPrimaryKey,
} from "./column_change/primary_key.js";
import { createIndexMigration, isCreateIndex } from "./index/create.js";
import {
	createFirstIndexMigration,
	isCreateFirstIndex,
} from "./index/create_first.js";
import { dropIndexMigration, isDropIndex } from "./index/drop.js";
import { dropAllIndexesMigration, isDropAllIndexes } from "./index/drop_all.js";
import { createTableMigration, isCreateTable } from "./table/create.js";
import { dropTableMigration, isDropTable } from "./table/drop.js";

export enum MigrationOpPriority {
	Table = 1,
	Column = 2,
	ChangeColumnDatatype = 3,
	ChangeColumnBase = 3.1,
	ChangeColumnPrimaryKeyDrop = 3.2,
	ChangeColumnPrimaryKeyCreate = 3.3,
	ChangeColumnForeignKeyCreate = 3.4,
	ChangeColumnForeignKeyDrop = 3.41,
	Index = 4,
}

export function migrationOp(
	difference: Difference,
	addedTables: string[],
	droppedTables: string[],
) {
	if (isCreateTable(difference)) return createTableMigration(difference);
	if (isDropTable(difference)) return dropTableMigration(difference);
	if (isCreateColumn(difference)) return createColumnMigration(difference);
	if (isDropColumn(difference)) return dropColumnMigration(difference);
	if (isColumnDataType(difference))
		return columnDatatypeMigrationOperation(difference);
	if (isColumnDefaultValue(difference))
		return columnDefaultMigrationOperation(difference);
	if (isColumnNullable(difference))
		return columnNullableMigrationOperation(difference);
	if (isColumnPrimaryKey(difference))
		return columnPrimaryKeyMigrationOperation(difference);
	if (isAddForeignKeyConstraintValue(difference))
		return addColumnForeignKeyMigrationOperation(difference);
	if (isRemoveForeignKeyConstraintValue(difference))
		return removeColumnForeignKeyMigrationOperation(difference);
	if (isCreateIndex(difference))
		return createIndexMigration(difference, addedTables);
	if (isCreateFirstIndex(difference))
		return createFirstIndexMigration(difference, addedTables);
	if (isDropIndex(difference))
		return dropIndexMigration(difference, droppedTables);
	if (isDropAllIndexes(difference))
		return dropAllIndexesMigration(difference, droppedTables);
	return [];
}

export function executeKyselySchemaStatement(...args: string[]) {
	return ["await db.schema", ...args, "execute();"].filter((x) => x !== "");
}

export function executeKyselyDbStatement(ops: string[]) {
	return ["await ", ...ops, "execute(db);"];
}
