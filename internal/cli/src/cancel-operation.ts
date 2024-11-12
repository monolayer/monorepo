import { Effect } from "effect";
import color from "picocolors";
import { exit } from "process";

export function cancelOperation() {
	return Effect.void.pipe(
		Effect.tap(() => console.log(color.red("Operation cancelled."))),
		Effect.tap(() => Effect.fail(exit(1))),
	);
}
