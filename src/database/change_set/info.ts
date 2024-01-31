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
	foreignKeyConstraint: {
		table: string;
		column: string;
	} | null;
};

export type IndexInfo = Record<string, Record<string, string>>;
