import { Difference } from "microdiff";
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
	isAddForeignKeyConstraintValue,
	isChangeOptionsForeignKeyConstraintValue,
	isRemoveForeignKeyConstraintValue,
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
	ChangeColumnForeignKeyChange = 3.42,
	ChangeColumnIdentityAdd = 3.5,
	ChangeColumnIdentityDrop = 3.51,
	ChangeColumnUniqueAdd = 3.6,
	ChangeColumnUniqueDrop = 3.61,
	ChangeColumnUniqueChange = 3.62,
	ChangeColumnDefaultAdd = 3.7,
	ChangeColumnDefaultDrop = 3.71,
	ChangeColumnDefaultChange = 3.72,
	Index = 4,
	PrimaryKeyDrop = 5,
	PrimaryKeyReplace = 5.1,
	PrimaryKeyCreate = 5.11,
	PrimaryKeyUpdate = 5.12,
	UniqueConstraintDrop = 6,
	UniqueConstraintCreate = 6.11,
	UniqueConstraintChange = 6.12,
	ForeignKeyConstraintDrop = 7,
	ForeignKeyConstraintCreate = 7.11,
	ForeignKeyConstraintChange = 7.12,
}

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
	if (isAddForeignKeyConstraintValue(difference))
		return addColumnForeignKeyMigrationOperation(difference);
	if (isRemoveForeignKeyConstraintValue(difference))
		return removeColumnForeignKeyMigrationOperation(difference);
	if (isChangeOptionsForeignKeyConstraintValue(difference))
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
	return [];
}

export function executeKyselySchemaStatement(...args: string[]) {
	return ["await db.schema", ...args, "execute();"].filter((x) => x !== "");
}

export function executeKyselyDbStatement(statement: string) {
	return [`await sql\`${statement}\`.execute(db);`];
}

export function executeKyselyDbStatements(statements: string[]) {
	return statements.flatMap((statement) => {
		return executeKyselyDbStatement(statement);
	});
}
