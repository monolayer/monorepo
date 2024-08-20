import * as p from "@clack/prompts";
import { type Changeset } from "@monorepo/pg/changeset/types.js";
import { migrationNamePrompt } from "@monorepo/prompts/migration-name.js";
import { Migrator } from "@monorepo/services/migrator.js";
import { Effect, pipe } from "effect";
import { appendAll, forEach, isNonEmptyArray } from "effect/Array";
import { all, andThen, flatMap, succeed, tap, zipWith } from "effect/Effect";
import { changeset } from "~programs/changeset/changeset.js";
import { validateUniqueSchemaName } from "~programs/changeset/validate-unique-schema-name.js";
import { schemaDependencies } from "~programs/dependencies.js";
import { computeExtensionChangeset as extensionChangeset } from "~programs/extension-changeset.js";

const render = (changeset: Changeset[]) =>
	pipe(
		all([Migrator, migrationNamePrompt()]),
		flatMap(([migrator, migrationName]) =>
			migrator.renderChangesets(changeset, migrationName),
		),
		tap((migration) =>
			forEach(migration, (migration) =>
				p.log.info(`Generated migration: ${migration}`),
			),
		),
	);

export const generateMigration = validateUniqueSchemaName.pipe(
	andThen(
		zipWith(extensionChangeset, changeset, (ecs, cs) =>
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

function sortChangesetsBySchemaPriority(
	changeset: Changeset[],
	mode: "up" | "down" = "up",
) {
	return Effect.gen(function* () {
		const schemaPriorities = yield* schemaDependencies;
		const schemaOrderIndex = schemaPriorities.reduce(
			(acc, name, index) => {
				acc[name] = index;
				return acc;
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{} as Record<string, any>,
		);
		return changeset.toSorted((a, b) => {
			const indexA =
				schemaOrderIndex[a.schemaName ?? "public"] ?? -changeset.length;
			const indexB =
				schemaOrderIndex[b.schemaName ?? "public"] ?? -changeset.length;
			switch (mode) {
				case "up":
					return indexA - indexB;
				case "down":
					return indexB - indexA;
			}
		});
	});
}
