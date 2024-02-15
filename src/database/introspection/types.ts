import type { OnModifyForeignAction } from "kysely";
import type { ColumnInfo } from "../schema/pg_column.js";

export type ForeIgnKeyConstraintInfo = {
	table: string;
	column: string;
	options: `${OnModifyForeignAction};${OnModifyForeignAction}`;
};

export type IndexInfo = Record<string, Record<string, string>>;

export type ExtensionInfo = Record<string, boolean>;

export type TriggerInfo = Record<string, Record<string, string>>;

export type DbTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};

export type ColumnsInfo = Record<string, ColumnInfo>;
export type TableColumnInfo = Record<string, ColumnsInfo>;

export type LocalTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};
