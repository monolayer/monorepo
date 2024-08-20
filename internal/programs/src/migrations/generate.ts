import * as p from "@clack/prompts";
import { Effect } from "effect";
import { appendAll, isNonEmptyArray } from "effect/Array";
import { andThen, flatMap, succeed, tap, zipWith } from "effect/Effect";
import { computeChangeset } from "~programs/changeset.js";
import { computeExtensionChangeset } from "~programs/extension-changeset.js";
import { render } from "~programs/migrations/render.js";
import { sortChangesetsBySchemaPriority } from "~programs/sort-changesets-by-schema-priority.js";
import { validateUniqueSchemaName } from "~programs/validate-unique-schema-name.js";

export const generateMigration = validateUniqueSchemaName.pipe(
	andThen(
		zipWith(computeExtensionChangeset, computeChangeset, (ecs, cs) =>
			appendAll(ecs, cs),
		).pipe(
			flatMap(sortChangesetsBySchemaPriority),
			tap((changeset) =>
				Effect.if(isNonEmptyArray(changeset), {
					onTrue: () => render(changeset),
					onFalse: () =>
						succeed(p.log.info(`Nothing to do. No changes detected.`)),
				}),
			),
		),
	),
);
