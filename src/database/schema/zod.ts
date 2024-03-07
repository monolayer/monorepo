import { ZodIssueCode, z } from "zod";

export function baseSchema(isNullable: boolean, errorMessage: string) {
	return z
		.any()
		.superRefine(required)
		.superRefine((val, ctx) => {
			nullable(val, ctx, isNullable, errorMessage);
		});
}

export function finishSchema(isNullable: boolean, schema: z.ZodTypeAny) {
	if (isNullable) return schema.nullish();
	return schema;
}

export function bigintSchema(isNullable: boolean) {
	return baseSchema(
		isNullable,
		"Expected BigInt, Number or String that can coerce to BigInt",
	)
		.superRefine((val, ctx) => {
			try {
				if (val === "") throw new Error("Invalid bigint");
				BigInt(val);
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid bigint",
				});
				return z.NEVER;
			}
		})
		.transform((val) => BigInt(val));
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
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid JSON",
			});
			return z.NEVER;
		}
		try {
			if (typeof val === "string") {
				JSON.parse(val);
			}
			JSON.stringify(val);
		} catch (e) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid JSON",
			});
			return z.NEVER;
		}
	});
}

export function variablePrecisionSchema(
	minimum: number,
	maximum: number,
	isNullable: boolean,
) {
	const errorMessage =
		"Expected bigint, Number or String that can be converted to a floating-point number or a bigint";

	return baseSchema(isNullable, errorMessage)
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			try {
				if (val === "") throw new Error("Invalid");
				if (typeof val === "string") {
					const number = parseFloat(val);
					if (typeof number === "number") {
						if (Number.isNaN(number) && val !== "NaN") {
							throw new Error("Invalid number");
						}
						return;
					}
					BigInt(val);
				}
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: errorMessage,
				});
				return z.NEVER;
			}
		})
		.superRefine((val: unknown) => {
			const stringValue = String(val);
			if (
				stringValue === "NaN" ||
				stringValue === "Infinity" ||
				stringValue === "-Infinity"
			) {
				return;
			}
		})
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			const stringValue = String(val);
			if (
				stringValue === "NaN" ||
				stringValue === "Infinity" ||
				stringValue === "-Infinity"
			) {
				return;
			}
			const number = Number(val);
			if (number < minimum || number > maximum) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Value must be between ${minimum} and ${maximum}, NaN, Infinity, or -Infinity`,
				});
				return z.NEVER;
			}
		})
		.transform((val) => {
			return Number(val);
		});
}

export function wholeNumberSchema(
	minimum: number,
	maximum: number,
	isNullable: boolean,
) {
	return baseSchema(
		isNullable,
		"Expected Number or String that can be converted to a number",
	)
		.superRefine((val, ctx) => {
			if (typeof val === "bigint") {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "number",
					received: typeof val,
				});
				return z.NEVER;
			}
		})
		.pipe(z.coerce.number().int().min(minimum).max(maximum));
}

export function decimalSchema(
	precision: number | null,
	scale: number | null,
	isNullable: boolean,
	errorMessage: string,
) {
	return baseSchema(isNullable, errorMessage)
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			try {
				if (typeof val === "string") {
					if (val === "") {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: "Invalid decimal",
						});
						return z.NEVER;
					}
					const number = parseFloat(val);
					if (typeof number === "number") {
						if (Number.isNaN(number) && val !== "NaN") {
							throw new Error("Invalid number");
						}
						return;
					}
					BigInt(val);
				}
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: errorMessage,
				});
				return z.NEVER;
			}
		})
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			const stringValue = String(val);
			if (
				stringValue === "NaN" ||
				stringValue === "Infinity" ||
				stringValue === "-Infinity"
			) {
				return;
			}
			const [wholeNumber, decimals] = stringValue.split(".");
			if (
				wholeNumber !== undefined &&
				precision !== null &&
				wholeNumber.length > precision
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Precision of ${precision} exeeded.`,
				});
				return z.NEVER;
			}
			if (
				decimals !== undefined &&
				scale !== null &&
				scale !== 0 &&
				decimals.length > scale
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Maximum scale ${scale} exeeded.`,
				});
				return z.NEVER;
			}
		})
		.transform((val) => {
			return parseFloat(val);
		});
}

export function stringSchema(
	errorMessage: string,
	isNullable: boolean,
	constructors = [] as string[],
) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (typeof val !== "string" && constructors.length === 0) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
		if (
			typeof val !== "string" &&
			constructors.length > 0 &&
			!constructors.includes(val.constructor.name)
		) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
	});
}

export function dateSchema(errorMessage: string, isNullable: boolean) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (val.constructor.name === "Date") return;
		if (typeof val !== "string") {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
		try {
			Date.parse(val);
		} catch {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
	});
}

export function required(val: unknown, ctx: z.RefinementCtx) {
	if (val === undefined) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Required",
			fatal: true,
		});
		return z.NEVER;
	}
}

export function nullable(
	val: unknown,
	ctx: z.RefinementCtx,
	nullable: boolean,
	message: string,
) {
	if (val === null && !nullable) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `${message}, received null`,
			fatal: true,
		});
		return z.NEVER;
	}
}
