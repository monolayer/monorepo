import type { IndexInfo, TableColumnInfo } from "../introspection/types.js";

type TableName = string;
type Name = string;
type Definition = string;
export type PrimaryKeyInfo = Record<TableName, Record<Name, Definition>>;
export type ForeignKeyInfo = Record<TableName, Record<Name, Definition>>;
export type UniqueInfo = Record<TableName, Record<Name, Definition>>;

export type ConstraintInfo = {
	unique: UniqueInfo;
	foreign: ForeignKeyInfo;
	primaryKey: PrimaryKeyInfo;
};

export type MigrationSchema = {
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	primaryKey: PrimaryKeyInfo;
};
