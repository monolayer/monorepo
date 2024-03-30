import { ZodIssueCode, z } from "zod";
import { type PgColumnBase } from "~/schema/table/column/column.js";
import {
	PgBoolean,
	type Boolish,
} from "~/schema/table/column/data-types/boolean.js";
import { finishSchema } from "../common.js";
import { customIssue, nullableColumn } from "../helpers.js";

export function isPgBoolean(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgBoolean {
	return column instanceof PgBoolean;
}

export function testBoolish(val: unknown): val is Boolish {
	switch (val) {
		case "true":
		case "false":
		case "yes":
		case "no":
		case 1:
		case 0:
		case "1":
		case "0":
		case "on":
		case "off":
		case true:
		case false:
		case null:
			return true;
		default:
			return false;
	}
}
export function pgBooleanSchema<T extends PgBoolean>(column: T) {
	const isNullable = nullableColumn(column);
	const base = z
		.any()
		.superRefine((data, ctx) => {
			if (!testBoolish(data)) {
				if (data === undefined) {
					ctx.addIssue({
						code: ZodIssueCode.invalid_type,
						expected: "boolean",
						received: "undefined",
					});
				} else {
					return customIssue(ctx, "Invalid boolean");
				}
				return z.NEVER;
			}
		})
		.transform(toBooleanOrNull)
		.superRefine((val, ctx) => {
			if (!isNullable && val === null) {
				ctx.addIssue({
					code: ZodIssueCode.invalid_type,
					expected: "boolean",
					received: "null",
				});
				return z.NEVER;
			}
		});
	return finishSchema(isNullable, base);
}

export function toBooleanOrNull(val: boolean | Boolish | null): boolean | null {
	switch (val) {
		case true:
		case "true":
		case 1:
		case "1":
		case "yes":
		case "on":
			return true;
		case false:
		case "false":
		case 0:
		case "0":
		case "no":
		case "off":
			return false;
		case null:
			return null;
	}
}
