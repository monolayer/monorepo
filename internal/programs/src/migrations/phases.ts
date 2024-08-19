import type { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { groupBy } from "effect/Array";
import { filter, flatMap, succeed } from "effect/Effect";
import { keys } from "effect/Record";
import { pendingMigrations } from "~programs/migrations/pending.js";

export const pendingPhases = pendingMigrations.pipe(
	flatMap((pending) => succeed(groupBy(pending, (p) => p.phase))),
	flatMap((pendingByPhase) =>
		succeed(keys(pendingByPhase) as ChangesetPhase[]),
	),
);

export function checkNoPendingPhases(phases: ChangesetPhase[]) {
	return pendingPhases.pipe(
		flatMap(filter((phase) => succeed(phases.includes(phase)))),
	);
}
