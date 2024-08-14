import type { ColumnType, Simplify } from "kysely";
import type { EnumInfo } from "~pg/introspection/enum.js";
import type { IndexInfo } from "~pg/introspection/index.js";
import type {
	CheckInfo,
	ForeignKeyInfo,
	PrimaryKeyInfo,
	UniqueInfo,
} from "~pg/introspection/schema.js";
import type { ForeignKeyIntrospection } from "~pg/introspection/table.js";
import type { TriggerInfo } from "~pg/introspection/trigger.js";

export type JsonArray = JsonValue[];

export type JsonValue =
	| boolean
	| number
	| string
	| Record<string, unknown>
	| JsonArray;

export type DateTimePrecision = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type OptionalColumnType<Select, Insert, Update> = Simplify<
	ColumnType<Select, Insert | undefined, Update>
>;

export type OptionalNullableColumnType<Select, Insert, Update> = Simplify<
	ColumnType<Select | null, Insert | null | undefined, Update | null>
>;

export type GeneratedColumnType<Select, Insert, Update> = OptionalColumnType<
	Select,
	Insert,
	Update
>;

export type WithDefaultColumn = {
	_hasDefault: true;
};

export type NonNullableColumn = { _nullable: false };

export type GeneratedColumn = {
	_generatedByDefault: true;
	_nullable: false;
};

export type GeneratedAlwaysColumn = {
	_generatedAlways: true;
};

export type TableInfo = {
	name: string;
	columns: Record<string, ColumnInfo>;
};

export type ColumnInfo = {
	columnName: string | null;
	dataType: string;
	defaultValue: string | null;
	volatileDefault: "unknown" | "yes" | "no";
	isNullable: boolean;
	originalIsNullable?: boolean | null;
	numericPrecision: number | null;
	numericScale: number | null;
	characterMaximumLength: number | null;
	datetimePrecision: number | null;
	identity: "ALWAYS" | "BY DEFAULT" | null;
	enum: boolean;
};

export type DbTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
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
