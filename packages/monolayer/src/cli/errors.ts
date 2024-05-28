import type { UnknownException } from "effect/Cause";
import { TaggedClass } from "effect/Data";
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
