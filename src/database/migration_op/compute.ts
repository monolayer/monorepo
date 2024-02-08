import { Difference } from "microdiff";
import {} from "vitest/dist/reporters-1evA5lom.js";
import type { DbTableInfo, LocalTableInfo } from "../introspection/types.js";
import { createColumnMigration, isCreateColumn } from "./column/create.js";
import { dropColumnMigration, isDropColumn } from "./column/drop.js";
import {
	columnDatatypeMigrationOperation,
	isColumnDataType,
} from "./column_change/data_type.js";
import {
	columnDefaultAddMigrationOperation,
	columnDefaultChangeMigrationOperation,
	columnDefaultDropMigrationOperation,
	isColumnDefaultAddValue,
	isColumnDefaultChangeValue,
	isColumnDefaultDropValue,
} from "./column_change/default.js";
import {
	addColumnForeignKeyMigrationOperation,
	changeColumnForeignKeyMigrationOperation,
	isAddForeignKeyConstraint,
	isChangeOptionsForeignKeyConstraint,
	isRemoveForeignKeyConstraint,
	removeColumnForeignKeyMigrationOperation,
} from "./column_change/foreign_key.js";
import {
	columnIdentityAddMigrationOperation,
	columnIdentityDropMigrationOperation,
	isColumnIdentityAdd,
	isColumnIdentityDrop,
} from "./column_change/identity.js";
import {
	columnNullableMigrationOperation,
	isColumnNullable,
} from "./column_change/nullable.js";
import {
	columnPrimaryKeyMigrationOperation,
	isColumnPrimaryKey,
} from "./column_change/primary_key.js";
import {
	columnUniqueNullDistinctAddMigrationOperation,
	columnUniqueNullDistinctChangeMigrationOperation,
	columnUniqueNullDistinctDropMigrationOperation,
	isUniqueAdd,
	isUniqueChange,
	isUniqueDrop,
} from "./column_change/unique.js";
import { createIndexMigration, isCreateIndex } from "./index/create.js";
import {
	createFirstIndexMigration,
	isCreateFirstIndex,
} from "./index/create_first.js";
import { dropIndexMigration, isDropIndex } from "./index/drop.js";
import { dropAllIndexesMigration, isDropAllIndexes } from "./index/drop_all.js";
import {
	createPrimaryKeyMigration,
	dropPrimaryKeyMigration,
	isPrimaryKeyCreateFirst,
	isPrimaryKeyDrop,
	isPrimaryKeyReplace,
	isPrimaryKeyUpdate,
	replacePrimaryKeyMigration,
	updatePrimaryKeyMigration,
} from "./primary_key.js";
import { createTableMigration, isCreateTable } from "./table/create.js";
import { dropTableMigration, isDropTable } from "./table/drop.js";
import {
	changeUniqueConstraintMigration,
	createUniqueConstraintMigration,
	dropUniqueConstraintMigration,
	isUniqueConstraintChange,
	isUniqueConstraintCreate,
	isUniqueConstraintDrop,
} from "./unique.js";

export function migrationOp(
	difference: Difference,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
	db: DbTableInfo,
) {
	if (isCreateTable(difference)) return createTableMigration(difference);
	if (isDropTable(difference)) return dropTableMigration(difference);
	if (isCreateColumn(difference)) return createColumnMigration(difference);
	if (isDropColumn(difference)) return dropColumnMigration(difference);
	if (isColumnDataType(difference))
		return columnDatatypeMigrationOperation(difference);
	if (isColumnDefaultAddValue(difference))
		return columnDefaultAddMigrationOperation(difference);
	if (isColumnDefaultDropValue(difference))
		return columnDefaultDropMigrationOperation(difference);
	if (isColumnDefaultChangeValue(difference))
		return columnDefaultChangeMigrationOperation(difference);
	if (isColumnNullable(difference))
		return columnNullableMigrationOperation(difference);
	if (isColumnPrimaryKey(difference))
		return columnPrimaryKeyMigrationOperation(difference);
	if (isAddForeignKeyConstraint(difference))
		return addColumnForeignKeyMigrationOperation(difference);
	if (isRemoveForeignKeyConstraint(difference))
		return removeColumnForeignKeyMigrationOperation(difference);
	if (isChangeOptionsForeignKeyConstraint(difference))
		return changeColumnForeignKeyMigrationOperation(difference, local, db);
	if (isColumnIdentityAdd(difference))
		return columnIdentityAddMigrationOperation(difference);
	if (isColumnIdentityDrop(difference))
		return columnIdentityDropMigrationOperation(difference);
	if (isCreateIndex(difference))
		return createIndexMigration(difference, addedTables);
	if (isCreateFirstIndex(difference))
		return createFirstIndexMigration(difference, addedTables);
	if (isDropIndex(difference))
		return dropIndexMigration(difference, droppedTables);
	if (isDropAllIndexes(difference))
		return dropAllIndexesMigration(difference, droppedTables);
	if (isUniqueAdd(difference))
		return columnUniqueNullDistinctAddMigrationOperation(difference);
	if (isUniqueDrop(difference))
		return columnUniqueNullDistinctDropMigrationOperation(difference);
	if (isUniqueChange(difference))
		return columnUniqueNullDistinctChangeMigrationOperation(difference);
	if (isPrimaryKeyCreateFirst(difference))
		return createPrimaryKeyMigration(difference, addedTables);
	if (isPrimaryKeyDrop(difference))
		return dropPrimaryKeyMigration(difference, droppedTables);
	if (isPrimaryKeyUpdate(difference))
		return updatePrimaryKeyMigration(difference, addedTables, droppedTables);
	if (isPrimaryKeyReplace(difference))
		return replacePrimaryKeyMigration(difference, addedTables, droppedTables);
	if (isAddForeignKeyConstraint(difference))
		return addColumnForeignKeyMigrationOperation(difference);
	if (isRemoveForeignKeyConstraint(difference))
		return removeColumnForeignKeyMigrationOperation(difference);
	if (isChangeOptionsForeignKeyConstraint(difference))
		return changeColumnForeignKeyMigrationOperation(difference, local, db);
	if (isUniqueConstraintCreate(difference))
		return createUniqueConstraintMigration(difference, addedTables);
	if (isUniqueConstraintDrop(difference))
		return dropUniqueConstraintMigration(difference, droppedTables);
	if (isUniqueConstraintChange(difference))
		return changeUniqueConstraintMigration(difference);
	return [];
}
