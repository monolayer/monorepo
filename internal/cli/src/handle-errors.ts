import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { Cause } from "effect/Cause";
import color from "picocolors";
import { cancelOperation } from "~cli/cancel-operation.js";
import { formatErrorStack, type ActionError } from "~cli/errors.js";

export const handleErrors = Effect.catchTags({
	ActionError: (error: ActionError) =>
		Effect.gen(function* () {
			p.log.error(`${color.red(error.message)}: ${error.message}`);
			p.outro(`${color.red("Failed")}`);
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
		p.log.error(`${color.red(error.name)} ${error.message}`);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const err = error as any;
		if (err.error !== undefined && err.error instanceof Error) {
			p.log.message(formatErrorStack(err.error.stack));
		} else {
			if (error.stack !== undefined) {
				p.log.message(formatErrorStack(error.stack));
			} else {
				p.log.message(JSON.stringify(error, null, 2));
			}
		}
	} else {
		p.log.error(color.red("Error"));
		p.log.message(JSON.stringify(cause, null, 2));
	}
	return Effect.void;
}
