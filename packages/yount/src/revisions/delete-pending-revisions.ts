import { Effect } from "effect";
import { unlinkSync } from "fs";

interface PendingRevision {
	name: string;
	path: string;
}

export function deletePendingRevisions(pendingRevisions: PendingRevision[]) {
	return Effect.forEach(pendingRevisions, deletePendingRevision).pipe(
		Effect.map(() => true),
	);
}

function deletePendingRevision(revision: PendingRevision) {
	return Effect.succeed(unlinkSync(revision.path));
}
