import { SetNonNullable } from "type-fest";
import type { ColumnInfo } from "~/schema/column.js";

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
		defaultValue:
			options.defaultValue !== undefined ? options.defaultValue : null,
		isNullable: options.isNullable ?? true,
		numericPrecision: options.numericPrecision ?? null,
		numericScale: options.numericScale ?? null,
		datetimePrecision: options.datetimePrecision ?? null,
		characterMaximumLength: options.characterMaximumLength ?? null,
		renameFrom: options.renameFrom ?? null,
		identity: options.identity ?? null,
		enum: options.enum ?? false,
	};
}
