import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import type { ProgramContext } from "../program-context.js";

export function checkWithFail({
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
	callback: () => Effect.Effect<boolean, unknown, ProgramContext>;
}) {
	return Effect.gen(function* () {
		const success = yield* check(name, callback);
		if (success) {
			return true;
		} else {
			p.log.error(errorMessage);
			p.note(nextSteps, "Next Steps");
			return yield* Effect.fail(failMessage);
		}
	});
}

function check(
	name: string,
	callback: () => Effect.Effect<boolean, unknown, ProgramContext>,
) {
	return Effect.gen(function* () {
		const spinner = p.spinner();
		spinner.start();
		const success = yield* callback();
		if (success) {
			spinner.stop(`${name} ${color.green("✓")}`);
		} else {
			spinner.stop(`${name} ${color.red("x")}`);
		}
		return success;
	});
}
