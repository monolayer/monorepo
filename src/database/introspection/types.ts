export type ColumnInfo = {
	columnName: string | null;
	tableName: string | null;
	dataType: string | null;
	defaultValue: string | null;
	isNullable: boolean | null;
	numericPrecision: number | null;
	numericScale: number | null;
	characterMaximumLength: number | null;
	datetimePrecision: number | null;
	renameFrom: string | null;
	primaryKey: true | null;
	foreignKeyConstraint: ForeIgnKeyConstraintInfo | null;
};

export type ForeIgnKeyConstraintInfo = {
	table: string;
	column: string;
};

export type IndexInfo = Record<string, Record<string, string>>;

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
