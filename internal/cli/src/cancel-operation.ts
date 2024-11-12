import { Effect } from "effect";
import { exit } from "process";

export function cancelOperation() {
	return Effect.void.pipe(Effect.tap(() => Effect.fail(exit(1))));
}
