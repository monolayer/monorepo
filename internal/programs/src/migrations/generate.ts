import * as p from "@clack/prompts";
import {
	MigrationOpPriority,
	type Changeset,
} from "@monorepo/pg/changeset/types.js";
import { Migrator } from "@monorepo/services/migrator.js";
import { Effect, pipe } from "effect";
import { appendAll, forEach, isNonEmptyArray } from "effect/Array";
import { all, andThen, flatMap, succeed, tap, zipWith } from "effect/Effect";
import { changeset } from "~programs/changeset/changeset.js";
import { validateUniqueSchemaName } from "~programs/changeset/validate-unique-schema-name.js";
import { schemaDependencies } from "~programs/dependencies.js";
import { computeExtensionChangeset as extensionChangeset } from "~programs/extension-changeset.js";
import { migrationNamePrompt } from "~programs/migration-name.js";

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

export function sortChangesetsBySchemaPriority(
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

export function extractMigrationOps(changesets: Changeset[]) {
	return Effect.gen(function* () {
		const sortForUp = yield* sortChangesetsBySchemaPriority(changesets, "up");

		const up = sortForUp
			.filter(
				(changeset) =>
					changeset.up.length > 0 && (changeset.up[0] || []).length > 0,
			)
			.map((changeset) =>
				changeset.up.map((u) => u.join("\n    .")).join("\n\n  "),
			);

		const sortForDown = yield* sortChangesetsBySchemaPriority(
			reverseChangeset(sortForUp),
			"down",
		);

		const down = sortForDown
			.filter(
				(changeset) =>
					changeset.down.length > 0 && (changeset.down[0] || []).length > 0,
			)
			.map((changeset) =>
				changeset.down.map((d) => d.join("\n    .")).join("\n\n  "),
			);
		return { up, down };
	});
}

function reverseChangeset(changesets: Changeset[]) {
	const itemsToMaintain = changesets.filter(
		(changeset) =>
			changeset.type === "createTable" || changeset.type === "dropTable",
	);

	const itemsToReverse = changesets.filter(
		(changeset) =>
			changeset.type !== "createTable" && changeset.type !== "dropTable",
	);

	const databasePriorities = [
		MigrationOpPriority.CreateSchema,
		MigrationOpPriority.CreateExtension,
		MigrationOpPriority.CreateEnum,
	];

	return [...itemsToMaintain, ...itemsToReverse.reverse()].sort((a, b) => {
		if (
			!databasePriorities.includes(a.priority) &&
			a.tableName === "none" &&
			b.tableName !== "none"
		) {
			return -1;
		}
		return 1 - 1;
	});
}
