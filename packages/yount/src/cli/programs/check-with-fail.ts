import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { ProgramContext } from "../program-context.js";
import { check } from "./spinner-task.js";

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
	return check(name, () =>
		Effect.succeed(true).pipe(Effect.flatMap(callback)),
	).pipe(
		Effect.flatMap((result) =>
			Effect.if(result, {
				onTrue: Effect.succeed(true),
				onFalse: Effect.succeed(true).pipe(
					Effect.flatMap(() => {
						p.log.error(errorMessage);
						p.note(nextSteps, "Next Steps");
						return Effect.fail(failMessage);
					}),
				),
			}),
		),
	);
}
