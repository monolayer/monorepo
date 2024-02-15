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
import {
	createExtensionMigration,
	dropExtensionMigration,
	isCreateExtensionDiff,
	isDropExtensionDiff,
} from "./extensions.js";
import {
	changeforeignKeyConstraintMigration,
	createforeignKeyConstraintMigration,
	dropforeignKeyConstraintMigration,
	isForeignKeyConstraintChange,
	isForeignKeyConstraintCreate,
	isForeignKeyConstraintDrop,
} from "./foreign_key.js";
import { changeIndexMigration, isChangeIndex } from "./index.js";
import { createFirstIndexMigration, isCreateFirstIndex } from "./index.js";
import { dropAllIndexesMigration, isDropAllIndexes } from "./index.js";
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
	changeTriggerMigration,
	createTriggerMigration,
	dropTriggerMigration,
	isTriggerChange,
	isTriggerCreate,
	isTriggerDrop,
} from "./trigger.js";
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
	if (isCreateExtensionDiff(difference))
		return createExtensionMigration(difference);
	if (isDropExtensionDiff(difference))
		return dropExtensionMigration(difference);
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
	if (isCreateFirstIndex(difference))
		return createFirstIndexMigration(difference, addedTables);
	if (isDropAllIndexes(difference))
		return dropAllIndexesMigration(difference, droppedTables);
	if (isChangeIndex(difference)) return changeIndexMigration(difference);
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
	if (isForeignKeyConstraintCreate(difference))
		return createforeignKeyConstraintMigration(difference, addedTables);
	if (isForeignKeyConstraintDrop(difference))
		return dropforeignKeyConstraintMigration(difference, droppedTables);
	if (isForeignKeyConstraintChange(difference))
		return changeforeignKeyConstraintMigration(difference);
	if (isUniqueConstraintCreate(difference))
		return createUniqueConstraintMigration(difference, addedTables);
	if (isUniqueConstraintDrop(difference))
		return dropUniqueConstraintMigration(difference, droppedTables);
	if (isUniqueConstraintChange(difference))
		return changeUniqueConstraintMigration(difference);
	if (isTriggerCreate(difference))
		return createTriggerMigration(difference, addedTables);
	if (isTriggerDrop(difference))
		return dropTriggerMigration(difference, droppedTables);
	if (isTriggerChange(difference)) return changeTriggerMigration(difference);
	return [];
}
