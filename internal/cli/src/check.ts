import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { ActionError } from "~cli/errors.js";

export function checkWithFail<E extends object, C extends object>({
	name,
	nextSteps,
	errorMessage,
	failMessage,
	callback,
}: {
	name: string;
	nextSteps: string;
	errorMessage: string;
	failMessage: string;
	callback: () => Effect.Effect<
		boolean,
		E extends object ? E : object,
		E extends object ? C : object
	>;
}) {
	return Effect.gen(function* () {
		const spinner = p.spinner();
		spinner.start();
		const success = yield* callback();
		if (success) {
			spinner.stop(`${name} ${color.green("✓")}`);
		} else {
			spinner.stop(`${name} ${color.red("x")}`);
		}
		if (success) {
			return true;
		} else {
			p.log.error(errorMessage);
			p.note(nextSteps, "Next Steps");
			return yield* Effect.fail(new ActionError("Check fail", failMessage));
		}
	});
}
