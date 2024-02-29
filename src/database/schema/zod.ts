import { z } from "zod";

export function bigintSchema() {
	return z
		.bigint()
		.or(z.number())
		.or(z.string())
		.transform((s, ctx) => {
			try {
				return BigInt(s);
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "bigint",
					received: "string",
					message: `Cannot convert '${s}' to a BigInt`,
				});
				return z.NEVER;
			}
		});
}

export function jsonSchema() {
	return z
		.string()
		.or(z.number())
		.or(z.boolean())
		.or(z.record(z.any()))
		.transform((val, ctx) => {
			try {
				if (typeof val === "string") {
					JSON.parse(val);
				}
				if (typeof val !== "number" || typeof val !== "boolean") {
					JSON.stringify(val);
				}
				return val;
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid JSON",
				});
				return z.NEVER;
			}
		});
}

export function columnSchemaFromNullAndUndefined<T extends z.ZodTypeAny>(
	primaryKey: boolean,
	nullable: boolean,
	base: T,
) {
	if (!primaryKey && nullable === true) {
		return base;
	}
	return base.refine((val) => val !== null);
}

export function variablePrecisionSchema(minimum: number, maximum: number) {
	return z
		.bigint()
		.or(z.number())
		.or(z.string())
		.transform((s, ctx) => {
			try {
				if (typeof s === "string") {
					parseFloat(s) || BigInt(s);
				}
				return s;
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "bigint",
					received: "string",
					message: `Cannot convert '${s}' to a Number or a BigInt`,
				});
				return z.NEVER;
			}
		})
		.pipe(z.coerce.number().min(minimum).max(maximum));
}

export function wholeNumberSchema(minimum: number, maximum: number) {
	return z
		.number()
		.or(z.string())
		.pipe(z.coerce.number().int().min(minimum).max(maximum));
}

export function decimalSchema(precision: number | null, scale: number | null) {
	return z
		.bigint()
		.or(z.number())
		.or(z.string())
		.transform((s, ctx) => {
			try {
				if (typeof s === "string") {
					return parseFloat(s) || BigInt(s);
				}
				return s;
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "bigint",
					received: "string",
					message: `Cannot convert '${s}' to a Number or a BigInt`,
				});
				return z.NEVER;
			}
		})
		.pipe(
			z.coerce
				.number()
				.refine(
					(n) => {
						const numberString = n.toString();
						const [wholeNumber, _decimals] = numberString.split(".");
						if (wholeNumber !== undefined && precision !== null) {
							return wholeNumber.length <= precision;
						}
						return true;
					},
					{
						message: `Precision of ${precision} exeeded.`,
					},
				)
				.refine(
					(n) => {
						const numberString = n.toString();
						const [_wholeNumber, decimals] = numberString.split(".");
						if (decimals !== undefined && scale !== null && scale !== 0) {
							return decimals.length <= scale;
						}
						return true;
					},
					{
						message: `Maximum scale ${scale} exeeded.`,
					},
				),
		);
}
