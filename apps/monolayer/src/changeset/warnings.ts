import { AddBigSerialColumn } from "./warnings/add-bigserial-column.js";
import type { AddNonNullableColumn } from "./warnings/add-non-nullable-column.js";
import { AddPrimaryKeyToExistingNullableColumn } from "./warnings/add-primary-key-to-existing-nullable-column.js";
import { AddPrimaryKeyToNewColumn } from "./warnings/add-primary-key-to-new-column.js";
import { AddSerialColumn } from "./warnings/add-serial-column.js";
import type { AddUniqueToExistingColumn } from "./warnings/add-unique.js";
import { AddVolatileDefault } from "./warnings/add-volatile-default.js";
import type { ChangeColumnToNonNullable } from "./warnings/change-column-to-non-nullable.js";
import { ChangeColumnType } from "./warnings/change-column-type.js";
import { ChangeWarningCode } from "./warnings/codes.js";
import { ColumnDrop } from "./warnings/column-drop.js";
import { ColumnRename } from "./warnings/column-rename.js";
import { SchemaDrop } from "./warnings/schema-drop.js";
import { TableDrop } from "./warnings/table-drop.js";
import { TableRename } from "./warnings/table-rename.js";

export type ChangeWarning =
	| BackwardIncompatibleChange
	| DestructiveChange
	| BlockingChange
	| MightFailChange;

export type BackwardIncompatibleChange = TableRename | ColumnRename;

export type DestructiveChange = SchemaDrop | TableDrop | ColumnDrop;

export type BlockingChange =
	| ChangeColumnType
	| AddVolatileDefault
	| AddSerialColumn
	| AddBigSerialColumn;

export type MightFailChange =
	| AddPrimaryKeyToExistingNullableColumn
	| AddPrimaryKeyToNewColumn
	| AddUniqueToExistingColumn
	| AddNonNullableColumn
	| ChangeColumnToNonNullable;

export function classifyWarnings(warnings: ChangeWarning[]) {
	return warnings.reduce(
		(acc, warning) => {
			switch (warning.code) {
				case ChangeWarningCode.TableRename:
					acc.tableRename = [...acc.tableRename, warning];
					break;
				case ChangeWarningCode.ColumnRename:
					acc.columnRename = [...acc.columnRename, warning];
					break;
				case ChangeWarningCode.TableDrop:
				case ChangeWarningCode.ColumnDrop:
				case ChangeWarningCode.SchemaDrop:
					acc.destructive = [...acc.destructive, warning];
					break;
				case ChangeWarningCode.ChangeColumnType:
					acc.changeColumnType = [...acc.changeColumnType, warning];
					break;
				case ChangeWarningCode.AddVolatileDefault:
					acc.changeColumnDefault = [...acc.changeColumnDefault, warning];
					break;
				case ChangeWarningCode.AddSerialColumn:
					acc.addSerialColumn = [...acc.addSerialColumn, warning];
					break;
				case ChangeWarningCode.AddBigSerialColumn:
					acc.addBigSerialColumn = [...acc.addBigSerialColumn, warning];
					break;
				case ChangeWarningCode.AddPrimaryKeyToExistingNullableColumn:
					acc.addPrimaryKeyToExistingNullableColumn = [
						...acc.addPrimaryKeyToExistingNullableColumn,
						warning,
					];
					break;
				case ChangeWarningCode.AddPrimaryKeyToNewColumn:
					acc.addPrimaryKeyToNewNullableColumn = [
						...acc.addPrimaryKeyToNewNullableColumn,
						warning,
					];
					break;
				case ChangeWarningCode.AddUniqueToExistingColumn:
					acc.addUniqueToExistingColumn = [
						...acc.addUniqueToExistingColumn,
						warning,
					];
					break;
				case ChangeWarningCode.AddNonNullableColumn:
					acc.addNonNullableColumn = [...acc.addNonNullableColumn, warning];
					break;
				case ChangeWarningCode.ChangeColumnToNonNullable:
					acc.changeColumnToNonNullable = [
						...acc.changeColumnToNonNullable,
						warning,
					];
					break;
			}
			return acc;
		},
		{
			tableRename: [] as Array<TableRename>,
			columnRename: [] as Array<ColumnRename>,
			destructive: [] as Array<DestructiveChange>,
			changeColumnType: [] as Array<ChangeColumnType>,
			changeColumnDefault: [] as Array<AddVolatileDefault>,
			addSerialColumn: [] as Array<AddSerialColumn>,
			addBigSerialColumn: [] as Array<AddBigSerialColumn>,
			addPrimaryKeyToExistingNullableColumn:
				[] as Array<AddPrimaryKeyToExistingNullableColumn>,
			addPrimaryKeyToNewNullableColumn: [] as Array<AddPrimaryKeyToNewColumn>,
			addUniqueToExistingColumn: [] as Array<AddUniqueToExistingColumn>,
			addNonNullableColumn: [] as Array<AddNonNullableColumn>,
			changeColumnToNonNullable: [] as Array<ChangeColumnToNonNullable>,
		},
	);
}
