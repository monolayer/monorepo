import type { PgColumn, SerialColumn } from "~pg/schema/column/column.js";
import type { PgJson } from "~pg/schema/column/data-types/json.js";
import type { PgJsonB } from "~pg/schema/column/data-types/jsonb.js";
import { baseSchema, finishSchema } from "../common.js";
import { customIssue, nullableColumn } from "../helpers.js";

export function isJson(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgJson {
	return column.constructor.name === "PgJson";
}

export function isJsonB(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgJsonB {
	return column.constructor.name === "PgJsonB";
}
export function pgJsonSchema(column: PgJson) {
	const isNullable = nullableColumn(column);
	const base = jsonSchema(isNullable);
	return finishSchema(isNullable, base);
}

export function pgJsonbSchema(column: PgJsonB) {
	const isNullable = nullableColumn(column);
	const base = jsonSchema(isNullable);
	return finishSchema(isNullable, base);
}

export function jsonSchema(isNullable: boolean) {
	return baseSchema(
		isNullable,
		"Expected value that can be converted to JSON",
	).superRefine((val, ctx) => {
		const allowedTypes = ["boolean", "number", "string"];
		if (
			!allowedTypes.includes(typeof val) &&
			val.constructor.name !== "Object"
		) {
			return customIssue(ctx, "Invalid JSON");
		}
		try {
			if (typeof val === "string") {
				JSON.parse(val);
			}
			JSON.stringify(val);
		} catch {
			return customIssue(ctx, "Invalid JSON");
		}
	});
}
