import { Effect } from "effect";
import { type Cause } from "effect/Cause";
import { fail } from "effect/Effect";
import color from "picocolors";
import { cancelOperation } from "~cli/cancel-operation.js";
import {
	formatErrorStack,
	type ActionError,
	type ErrnoException,
} from "~cli/errors.js";

export const handleErrors = Effect.catchTags({
	ActionError: (error: ActionError) =>
		Effect.gen(function* () {
			console.log(`${color.red(error.message)}: ${error.message}`);
			console.log(`${color.red("Failed")}`);
			yield* Effect.fail("exit");
		}),
	ExitWithSuccess: () => Effect.succeed(1),
	PromptCancelError: () => cancelOperation(),
});

export const catchErrorTags = Effect.catchTags({
	ExitWithSuccess: () => Effect.succeed(1),
	PromptCancelError: () => cancelOperation(),
});

export const printAnyErrors = Effect.tapErrorCause(printCause);

export function printCause(cause: Cause<unknown>) {
	const error =
		cause._tag === "Die" && cause.defect instanceof Error
			? cause.defect
			: cause._tag === "Fail" && cause.error instanceof Error
				? cause.error
				: undefined;
	if (error !== undefined) {
		console.log(`${color.red(error.name)} ${error.message}`);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const err = error as any;
		if (err.error !== undefined && err.error instanceof Error) {
			console.log(formatErrorStack(err.error.stack));
		} else {
			if (error.stack !== undefined) {
				console.log(formatErrorStack(error.stack));
			} else {
				console.log(JSON.stringify(error, null, 2));
			}
		}
	} else {
		console.log(color.red("Error"));
		console.log(JSON.stringify(cause, null, 2));
	}
	return Effect.void;
}

export function printCauseNew(cause: Cause<unknown>) {
	console.dir(cause, { depth: null });
	const error =
		cause._tag === "Die" && cause.defect instanceof Error
			? cause.defect
			: cause._tag === "Fail" && cause.error instanceof Error
				? cause.error
				: undefined;
	if (error !== undefined) {
		console.error(`\n${color.red(error.name)} ${error.message}\n`);
		if (error.stack !== undefined) {
			console.error(formatErrorStack(error.stack));
		} else {
			console.error(JSON.stringify(error, null, 2));
		}
	}
	return Effect.void;
}

export const handleErrorsNew = Effect.catchTags({
	ErrnoException: (error: ErrnoException) => {
		console.error(`\n${color.red(error.error.name)} ${error.error.message}\n`);
		if (error.error.stack !== undefined) {
			console.error(formatErrorStack(error.error.stack));
		} else {
			console.error(JSON.stringify(error, null, 2));
		}
		return fail(process.exit(1));
	},
	ActionError: (error: ActionError) =>
		Effect.gen(function* () {
			console.log(`${color.red(error.message)}: ${error.message}`);
			console.log(`${color.red("Failed")}`);
			yield* Effect.fail("exit");
		}),
	ExitWithSuccess: () => Effect.succeed(1),
	PromptCancelError: () => cancelOperation(),
});
