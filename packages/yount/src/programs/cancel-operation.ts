import * as p from "@clack/prompts";
import { Effect } from "effect";
import { exit } from "process";

export function cancelOperation() {
	return Effect.void.pipe(
		Effect.tap(() => p.cancel("Operation cancelled.")),
		Effect.tap(() => Effect.fail(exit(1))),
	);
}
