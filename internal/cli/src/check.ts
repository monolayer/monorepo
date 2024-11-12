import { Effect } from "effect";
import ora from "ora";
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
		const spinner = ora();
		spinner.start();
		const success = yield* callback();
		if (success) {
			spinner.succeed(name);
		} else {
			spinner.fail(name);
		}
		if (success) {
			return true;
		} else {
			console.log(errorMessage);
			console.log("Next Steps:");
			console.log(nextSteps);
			return yield* Effect.fail(new ActionError("Check fail", failMessage));
		}
	});
}
