import { z } from "zod";

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
