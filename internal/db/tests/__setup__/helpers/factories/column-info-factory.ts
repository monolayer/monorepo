import type { ColumnInfo } from "@monorepo/pg/schema/column/types.js";
import { SetNonNullable } from "type-fest";

type required = SetNonNullable<Pick<ColumnInfo, "dataType" | "columnName">>;
type optional = Partial<
	SetNonNullable<Omit<ColumnInfo, "tableName" | "dataType" | "columnName">>
>;

export type ColumnInfoFactoryOptions = required & optional;

export function columnInfoFactory(options: ColumnInfoFactoryOptions) {
	return {
		columnName: options.columnName,
		dataType: options.dataType,
		defaultValue:
			options.defaultValue !== undefined ? options.defaultValue : null,
		isNullable: options.isNullable ?? true,
		numericPrecision: options.numericPrecision ?? null,
		numericScale: options.numericScale ?? null,
		datetimePrecision: options.datetimePrecision ?? null,
		characterMaximumLength: options.characterMaximumLength ?? null,
		identity: options.identity ?? null,
		enum: options.enum ?? false,
		volatileDefault: options.volatileDefault ?? "unknown",
	};
}
