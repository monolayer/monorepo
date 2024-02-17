import { isExpression } from "kysely";
import { SetNonNullable } from "type-fest";
import { compileDefaultExpression } from "~/database/introspection/local_schema.js";
import type { ColumnInfo } from "~/index.js";

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
			options.defaultValue !== undefined
				? isExpression(options.defaultValue)
					? compileDefaultExpression(options.defaultValue)
					: options.defaultValue.toString()
				: null,
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
