import { Effect } from "effect";
import { unlinkSync } from "fs";

export function deletePendingRevisions(
	pending: {
		name: string;
		path: string;
	}[],
) {
	return Effect.succeed(true).pipe(
		Effect.flatMap(() =>
			Effect.forEach(pending, (pendingRevision) =>
				Effect.succeed(true).pipe(
					Effect.map(() => {
						unlinkSync(pendingRevision.path);
					}),
				),
			),
		),
	);
}
