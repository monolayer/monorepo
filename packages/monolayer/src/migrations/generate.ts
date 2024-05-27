import * as p from "@clack/prompts";
import { Effect } from "effect";
import { printChangesetSummary } from "~/changeset/print-changeset-summary.js";
import { type Changeset } from "~/changeset/types.js";
import { validateUniqueSchemaName } from "~/changeset/validate-unique-schema-name.js";
import { computeExtensionChangeset } from "~/database/extension/changeset.js";
import { schemaDependencies } from "~/introspection/dependencies.js";
import { changeset } from "../changeset/changeset.js";
import { Migrator } from "../services/migrator.js";
import { migrationName } from "./migration.js";

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
			yield* migrator.renderChangesets(
				sorted,
				name ?? (yield* migrationName()),
			);
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
