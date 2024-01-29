export type ColumnInfo = {
	columnName: string | null;
	tableName: string | null;
	dataType: string | null;
	default: string | null;
	isNullable: boolean | null;
	numericPrecision: number | null;
	numericScale: number | null;
	characterMaximumLength: number | null;
	datetimePrecision: number | null;
	renameFrom: string | null;
};
