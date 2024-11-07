import { gen, type Effect } from "effect/Effect";
import type { Difference } from "microdiff";
import type { CodeChangeset } from "./types/changeset.js";

export function codeChangeset<A, SE, SR, TR, TE>(opts: {
	validate: (diff: Difference) => Effect<boolean, TR, TE>;
	process: (
		successDiff: A,
	) => Effect<CodeChangeset | CodeChangeset[] | undefined, SE, SR>;
}) {
	const fn = (diff: Difference) =>
		gen(function* () {
			const res = yield* opts.validate(diff);
			if (res) {
				return yield* opts.process(diff as A);
			} else {
				return undefined;
			}
		});
	return fn;
}
