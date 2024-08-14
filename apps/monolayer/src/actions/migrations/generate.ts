import * as p from "@clack/prompts";
import { printChangesetSummary } from "@monorepo/pg/changeset/summary.js";
import { type Changeset } from "@monorepo/pg/changeset/types.js";
import { computeExtensionChangeset } from "@monorepo/programs/extension-changeset.js";
import { migrationNamePrompt } from "@monorepo/prompts/migration-name.js";
import { schemaDependencies } from "@monorepo/services/dependencies.js";
import { Migrator } from "@monorepo/services/migrator.js";
import { Effect } from "effect";
import { validateUniqueSchemaName } from "~monolayer/changeset/validate-unique-schema-name.js";
import { changeset } from "../../changeset/changeset.js";

export function generateMigration(name?: string) {
	return Effect.gen(function* () {
		yield* validateUniqueSchemaName();
		const allChangeset = (yield* computeExtensionChangeset()).concat(
			yield* changeset(),
		);

		if (allChangeset.length > 0) printChangesetSummary(allChangeset);

		const sorted = yield* sortChangesetsBySchemaPriority(allChangeset);
		if (allChangeset.length > 0) {
			const migrator = yield* Migrator;
			const renderedMigrations = yield* migrator.renderChangesets(
				sorted,
				name ?? (yield* migrationNamePrompt()),
			);
			for (const renderedMigration of renderedMigrations) {
				p.log.info(`Generated migration: ${renderedMigration}`);
			}
		} else {
			p.log.info(`Nothing to do. No changes detected.`);
		}
		return sorted;
	});
}

function sortChangesetsBySchemaPriority(
	changeset: Changeset[],
	mode: "up" | "down" = "up",
) {
	return Effect.gen(function* () {
		const schemaPriorities = yield* schemaDependencies();
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
