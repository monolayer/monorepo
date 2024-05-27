import { AddBigSerialColumn } from "./warnings/add-bigserial-column.js";
import { AddPrimaryKeyToExistingNullableColumn } from "./warnings/add-primary-key-to-existing-nullable-column.js";
import { AddPrimaryKeyToNewColumn } from "./warnings/add-primary-key-to-new-column.js";
import { AddSerialColumn } from "./warnings/add-serial-column.js";
import type { AddUniqueToExistingColumn } from "./warnings/add-unique.js";
import { AddVolatileDefault } from "./warnings/add-volatile-default.js";
import { ChangeColumnType } from "./warnings/change-column-type.js";
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
	| AddUniqueToExistingColumn;
