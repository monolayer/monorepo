import { kebabCase } from "case-anything";
import { Effect } from "effect";
import { revisionNamePrompt } from "~/prompts/revision-name.js";
import { PromptCancelError } from "../programs/cli-action.js";

export function revisionName() {
	return Effect.gen(function* (_) {
		const revisionName = yield* _(
			Effect.tryPromise(() => revisionNamePrompt()),
		);
		if (typeof revisionName !== "string") {
			return yield* _(Effect.fail(new PromptCancelError()));
		}
		return kebabCase(revisionName);
	});
}
