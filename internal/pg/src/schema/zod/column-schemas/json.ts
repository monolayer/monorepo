import type { PgColumn, SerialColumn } from "~/schema/column/column.js";
import { PgJson } from "~/schema/column/data-types/json.js";
import { PgJsonB } from "~/schema/column/data-types/jsonb.js";
import { baseSchema, finishSchema } from "~/schema/zod/common.js";
import { customIssue, nullableColumn } from "~/schema/zod/helpers.js";

export function isJson(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgJson {
	return column instanceof PgJson;
}

export function isJsonB(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgJsonB {
	return column instanceof PgJsonB;
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
