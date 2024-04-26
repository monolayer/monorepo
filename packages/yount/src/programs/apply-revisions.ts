import { Effect } from "effect";
import type { Changeset } from "~/changeset/types.js";
import { dumpDatabaseStructure } from "./dump-database-structure.js";
import { migrate } from "./migrate.js";

export function applyRevisions(changeset: Changeset[]) {
	return Effect.if(changeset.length > 0, {
		onTrue: migrate().pipe(
			Effect.tap((result) =>
				Effect.if(result, {
					onTrue: dumpDatabaseStructure(),
					onFalse: Effect.succeed(true),
				}),
			),
		),
		onFalse: Effect.succeed(true),
	});
}
