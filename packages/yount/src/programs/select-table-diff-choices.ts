import { Effect } from "effect";
import { tableDiffPrompt } from "../prompts/table-diff.js";
import { PromptCancelError } from "./cli-action.js";
import { IntrospectionContext, TablesToRename } from "./introspect-schemas.js";

export function selectTableDiffChoicesInteractive(
	context: IntrospectionContext,
) {
	return Effect.gen(function* (_) {
		if (
			context.tableDiff.deleted.length === 0 ||
			context.tableDiff.added.length === 0
		) {
			return yield* _(Effect.succeed([] as TablesToRename));
		}
		const tablesToRename = yield* _(
			Effect.tryPromise(() => tableDiffPrompt(context.tableDiff)).pipe(
				Effect.flatMap((tableDiffResult) => {
					if (typeof tableDiffResult === "symbol") {
						return Effect.fail(new PromptCancelError());
					} else {
						return Effect.succeed(tableDiffResult);
					}
				}),
			),
		);
		context.tablesToRename = tablesToRename;
		return yield* _(Effect.succeed(tablesToRename));
	});
}
