import type { UnknownException } from "effect/Cause";
import { TaggedClass } from "effect/Data";
import { sep } from "node:path";
import color from "picocolors";
import type { MigrationDependencyError } from "~/migrations/validate.js";

export class ExitWithSuccess extends TaggedClass("ExitWithSuccess")<{
	readonly cause: string;
}> {
	readonly _tag = "ExitWithSuccess";
}

export class PromptCancelError {
	readonly _tag = "PromptCancelError";
}

export class ActionError {
	readonly _tag = "ActionError";
	constructor(
		readonly name: string,
		readonly message: string,
	) {}
}

export class UnknownActionError {
	readonly _tag = "UnknownActionError";
	constructor(
		readonly name: string,
		readonly error: unknown,
	) {}
}
export type ActionErrors =
	| ActionError
	| ExitWithSuccess
	| UnknownActionError
	| PromptCancelError
	| MigrationDependencyError
	| UnknownException;

export function formatErrorStack(stack: string) {
	return (
		"  " +
		parseStack(stack)
			.map((l) =>
				l
					.replace("at", color.gray("at"))
					.replace(/\((.+)\)/, `(${color.blue("$1")})`),
			)
			.join("\n  ")
	);
}

// From consola
// https://raw.githubusercontent.com/unjs/consola/main/src/utils/error.ts
function parseStack(stack: string) {
	const cwd = process.cwd() + sep;

	const lines = stack
		.split("\n")
		.splice(1)
		.map((l) => l.trim().replace("file://", "").replace(cwd, ""));

	return lines;
}
