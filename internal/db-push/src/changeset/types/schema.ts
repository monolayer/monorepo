import type { EnumInfo } from "@monorepo/pg/introspection/enum.js";
import type { IndexInfo } from "@monorepo/pg/introspection/index.js";
import type {
	CheckInfo,
	ForeignKeyInfo,
	PrimaryKeyInfo,
	UniqueInfo,
} from "@monorepo/pg/introspection/schema.js";
import type { ForeignKeyIntrospection } from "@monorepo/pg/introspection/table.js";
import type { TriggerInfo } from "@monorepo/pg/introspection/trigger.js";


export type ColumnInfo = {
	columnName: string | null;
	dataType: string;
	defaultValue: string | null;
	volatileDefault: "unknown" | "yes" | "no";
	isNullable: boolean;
	originalIsNullable?: boolean | null;
	splitColumn?: boolean;
	numericPrecision: number | null;
	numericScale: number | null;
	characterMaximumLength: number | null;
	datetimePrecision: number | null;
	identity: "ALWAYS" | "BY DEFAULT" | null;
	enum: boolean;
};


export type TableColumnInfo = Record<
	string,
	{
		name: string;
		columns: Record<string, ColumnInfo>;
	}
>;

export type LocalTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};

export type SchemaInfo = Record<string, boolean>;

export type SchemaMigrationInfo = {
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	checkConstraints: CheckInfo;
	primaryKey: PrimaryKeyInfo;
	triggers: TriggerInfo;
	enums: EnumInfo;
	foreignKeyDefinitions?: Record<
		string,
		Record<string, ForeignKeyIntrospection>
	>;
	tablePriorities: string[];
	schemaInfo: SchemaInfo;
};
