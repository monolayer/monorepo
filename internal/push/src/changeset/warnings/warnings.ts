import type { AddBigSerialColumn } from "~push/changeset/warnings/add-bigserial-column.js";
import type { AddNonNullableColumn } from "~push/changeset/warnings/add-non-nullable-column.js";
import type { AddPrimaryKeyToExistingNullableColumn } from "~push/changeset/warnings/add-primary-key-to-existing-nullable-column.js";
import type { AddPrimaryKeyToNewColumn } from "~push/changeset/warnings/add-primary-key-to-new-column.js";
import type { AddSerialColumn } from "~push/changeset/warnings/add-serial-column.js";
import type { AddUniqueToExistingColumn } from "~push/changeset/warnings/add-unique.js";
import type { AddVolatileDefault } from "~push/changeset/warnings/add-volatile-default.js";
import type { ChangeColumnToNonNullable } from "~push/changeset/warnings/change-column-to-non-nullable.js";
import type { ChangeColumnType } from "~push/changeset/warnings/change-column-type.js";
import { ChangeWarningCode } from "~push/changeset/warnings/codes.js";
import type { ColumnDrop } from "~push/changeset/warnings/column-drop.js";
import type { ColumnRename } from "~push/changeset/warnings/column-rename.js";
import type { ExtensionDrop } from "~push/changeset/warnings/extension-drop.js";
import type { SchemaDrop } from "~push/changeset/warnings/schema-drop.js";
import type { TableDrop } from "~push/changeset/warnings/table-drop.js";
import type { TableRename } from "~push/changeset/warnings/table-rename.js";
import type { TriggerDrop } from "~push/changeset/warnings/trigger-drop.js";

export type ChangeWarning =
	| BackwardIncompatibleChange
	| DestructiveChange
	| BlockingChange
	| MightFailChange;

export type BackwardIncompatibleChange = TableRename | ColumnRename;

export type DestructiveChange =
	| SchemaDrop
	| TableDrop
	| ColumnDrop
	| TriggerDrop
	| ExtensionDrop;

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
				case ChangeWarningCode.TriggerDrop:
				case ChangeWarningCode.ExtensionDrop:
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
