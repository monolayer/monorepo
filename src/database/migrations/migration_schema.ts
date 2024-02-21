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
	if (table !== undefined && table[columName] !== undefined) {
		return table[columName];
	}
}

export function findPrimaryKey(schema: MigrationSchema, tableName: string) {
	return Object.entries(schema.primaryKey).flatMap(
		([schemaTableName, primaryKeyRecord]) => {
			if (schemaTableName === tableName) {
				for (const primaryKeyDefinition of Object.values(primaryKeyRecord)) {
					return extractColumnsFromPrimaryKey(primaryKeyDefinition);
				}
			}
			return [];
		},
	);
}

export function extractColumnsFromPrimaryKey(pkey: string) {
	const [_, columns] = pkey.split("PRIMARY KEY (");
	return columns?.replace(/"/g, "").split(")")[0]?.split(", ") || [];
}
