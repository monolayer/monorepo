import { z } from "zod";
import {
	PgBoolean,
	PgColumnBase,
	PgColumnTypes,
	PgEnum,
	PgText,
} from "./pg_column.js";

export function zodSchema(column: PgColumnTypes) {
	switch (column.constructor) {
		case PgBoolean:
			isBoolean(column);
			return booleanSchema(column);
		case PgText:
			isText(column);
			return textSchema(column);
		default:
			return z.unknown();
	}
}

function columnSchemaWithBase(
	column: PgColumnTypes,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	base: z.ZodType<any, any, any>,
) {
	if (column instanceof PgEnum) {
		return base;
	}
	const info = PgColumnBase.info(column);

	if (
		(column._isPrimaryKey && info.defaultValue !== null) ||
		(info.isNullable === false && info.defaultValue !== null)
	) {
		return base.optional();
	}

	if (!column._isPrimaryKey && info.isNullable === true) {
		return base.nullable().optional();
	}
	return base;
}

function isBoolean(column: PgColumnTypes): asserts column is PgBoolean {
	if (column instanceof PgBoolean) {
		return;
	}
	throw new Error("Only a PgBoolean column is allowed");
}

function booleanSchema(column: PgBoolean) {
	const base = z
		.boolean()
		.or(z.string().refine((s) => s === "true" || s === "false"))
		.pipe(z.coerce.boolean());

	return columnSchemaWithBase(column, base);
}

function isText(column: PgColumnTypes): asserts column is PgText {
	if (column instanceof PgText) {
		return;
	}
	throw new Error("Only a PgText column is allowed");
}

function textSchema(column: PgText) {
	const base = z.string();
	return columnSchemaWithBase(column, base);
}
