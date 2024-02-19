import type {
	EnumInfo,
	ExtensionInfo,
	IndexInfo,
	TableColumnInfo,
} from "../introspection/types.js";

type TableName = string;
type Name = string;
type Definition = string;
export type PrimaryKeyInfo = Record<TableName, Record<Name, Definition>>;
export type ForeignKeyInfo = Record<TableName, Record<Name, Definition>>;
export type UniqueInfo = Record<TableName, Record<Name, Definition>>;
export type TriggerInfo = Record<TableName, Record<Name, Definition>>;

export type ConstraintInfo = {
	unique: UniqueInfo;
	foreign: ForeignKeyInfo;
	primaryKey: PrimaryKeyInfo;
};

export type MigrationSchema = {
	extensions: ExtensionInfo;
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	primaryKey: PrimaryKeyInfo;
	triggers: TriggerInfo;
	enums: EnumInfo;
};

export function findColumn(
	schema: MigrationSchema,
	tableName: string,
	columName: string,
) {
	const table = schema.table[tableName];
	if (table === undefined) {
		return null;
	}
	const column = table[columName];
	if (column === undefined) {
		return null;
	}
	return column;
}

export function findPrimaryKey(schema: MigrationSchema, tableName: string) {
	const primaryKeyEntry = schema.primaryKey[tableName];
	if (primaryKeyEntry === undefined) {
		return undefined;
	}
	const pKeyName = Object.keys(primaryKeyEntry)[0];
	if (pKeyName === undefined) {
		return undefined;
	}
	return extractColumnsFromPrimaryKey(primaryKeyEntry[pKeyName] || "");
}

function extractColumnsFromPrimaryKey(pkey: string) {
	const [_, columns] = pkey.split("PRIMARY KEY (");
	if (columns === undefined) {
		return null;
	}
	const [column] = columns.split(")");
	return column?.split(", ");
}
