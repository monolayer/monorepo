import type { AddBigSerialColumn } from "~/changeset/warnings/add-bigserial-column.js";
import type { AddNonNullableColumn } from "~/changeset/warnings/add-non-nullable-column.js";
import type { AddPrimaryKeyToExistingNullableColumn } from "~/changeset/warnings/add-primary-key-to-existing-nullable-column.js";
import type { AddPrimaryKeyToNewColumn } from "~/changeset/warnings/add-primary-key-to-new-column.js";
import type { AddSerialColumn } from "~/changeset/warnings/add-serial-column.js";
import type { AddUniqueToExistingColumn } from "~/changeset/warnings/add-unique.js";
import type { AddVolatileDefault } from "~/changeset/warnings/add-volatile-default.js";
import type { ChangeColumnToNonNullable } from "~/changeset/warnings/change-column-to-non-nullable.js";
import type { ChangeColumnType } from "~/changeset/warnings/change-column-type.js";
import { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import type { ColumnDrop } from "~/changeset/warnings/column-drop.js";
import type { ColumnRename } from "~/changeset/warnings/column-rename.js";
import type { SchemaDrop } from "~/changeset/warnings/schema-drop.js";
import type { TableDrop } from "~/changeset/warnings/table-drop.js";
import type { TableRename } from "~/changeset/warnings/table-rename.js";

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
