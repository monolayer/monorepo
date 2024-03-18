import { z, type ParseInput, type ZodIssue } from "zod";
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
	if (isNullable) {
		const optionalBase = schema.nullable().optional();
		optionalBase._parse = rejectExplicitUndefinedParser(optionalBase);
		return optionalBase;
	}
	return schema;
}

export function stringSchema(errorMessage: string, isNullable: boolean) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (typeof val !== "string") {
			return customIssue(ctx, `${errorMessage}, received ${typeof val}`);
		}
	});
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rejectExplicitUndefinedParser(schema: z.ZodOptional<any>) {
	const originalParse = schema._parse;
	const modFunc = function myParse(
		this: { input: ParseInput },
		input: ParseInput,
	) {
		const ctx = schema._getOrReturnCtx(input);
		const isValid = {
			valid: true,
			path: [] as z.ParsePath,
		};
		if (ctx.path.length === 0) {
			if (ctx.parent?.data === undefined) {
				isValid.valid = false;
				isValid.path = ctx.path;
			}
		} else if (ctx.path.constructor.name === "Array" && ctx.path.length === 1) {
			const key = ctx.path[0] as string;
			const parentData = fetchDataFromParent(ctx);
			if (
				Object.keys(parentData).includes(key) &&
				parentData[key] === undefined
			) {
				isValid.valid = false;
				isValid.path = ctx.path;
			}
		}
		if (isValid.valid === false) {
			const issue = undefinedIssue(ctx.path);
			ctx.common.issues.push(issue);
			return {
				status: "aborted",
				value: [issue],
			} as z.ParseReturnType<false>;
		}
		return originalParse.call(this, input);
	};
	return modFunc;
}

function undefinedIssue(path: z.ParsePath) {
	const issue: ZodIssue = {
		code: "custom",
		path: path,
		message: "Value cannot be undefined",
		fatal: true,
	};
	return issue;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchDataFromParent(ctx: any) {
	if (ctx.parent === null) {
		return ctx.data;
	}
	const parent = ctx.parent;
	if (parent.parent === undefined) {
		return parent.data;
	}
	return fetchDataFromParent(parent);
}
