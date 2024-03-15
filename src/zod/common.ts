import { z } from "zod";
import { customIssue } from "./helpers.js";
import { nullable, required } from "./refinements.js";

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

export function stringSchema(errorMessage: string, isNullable: boolean) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (typeof val !== "string") {
			return customIssue(ctx, `${errorMessage}, received ${typeof val}`);
		}
	});
}
