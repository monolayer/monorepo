import type { IndexInfo, TableColumnInfo } from "../introspection/types.js";

export type ConstraintInfo = {
	unique: Record<string, string>;
	foreign: Record<string, string>;
};

export type MigrationSchema = {
	table: TableColumnInfo;
	index: IndexInfo;
	constraints: ConstraintInfo;
	primaryKey: Record<string, string>;
};
