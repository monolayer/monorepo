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
	if (isNullable) return schema.nullable();
	return schema;
}

export function bigintSchema(isNullable: boolean) {
	return baseSchema(
		isNullable,
		"Expected BigInt, Number or String that can coerce to BigInt",
	)
		.superRefine((val, ctx) => {
			try {
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
				if (typeof val === "string") {
					parseFloat(val) || BigInt(val);
				}
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: errorMessage,
				});
				return z.NEVER;
			}
		})
		.pipe(z.coerce.number().min(minimum).max(maximum));
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
					parseFloat(val) || BigInt(val);
				}
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: errorMessage,
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
