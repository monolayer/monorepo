import { Effect } from "effect";
import { allRevisions } from "~/revisions/all-revisions.js";

export function revisionDependency() {
	return Effect.gen(function* (_) {
		const revisions = yield* _(allRevisions());
		return revisions.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
	});
}
