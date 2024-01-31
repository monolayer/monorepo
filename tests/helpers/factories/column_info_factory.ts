import { SetNonNullable } from "type-fest";
import { ColumnInfo } from "~/database/change_set/info.js";

type required = SetNonNullable<
	Pick<ColumnInfo, "tableName" | "dataType" | "columnName">
>;
type optional = Partial<
	SetNonNullable<Omit<ColumnInfo, "tableName" | "dataType" | "columnName">>
>;

export function columnInfoFactory(options: required & optional) {
	return {
		tableName: options.tableName,
		columnName: options.columnName,
		dataType: options.dataType,
		defaultValue: options.defaultValue ?? null,
		isNullable: options.isNullable ?? true,
		numericPrecision: options.numericPrecision ?? null,
		numericScale: options.numericScale ?? null,
		datetimePrecision: options.datetimePrecision ?? null,
		characterMaximumLength: options.characterMaximumLength ?? null,
		renameFrom: options.renameFrom ?? null,
		primaryKey: options.primaryKey ?? null,
		foreignKeyConstraint: null,
	};
}
