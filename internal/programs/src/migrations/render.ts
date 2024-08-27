import * as p from "@clack/prompts";
import { printWarnings } from "@monorepo/pg/changeset/summary.js";
import type { Changeset } from "@monorepo/pg/changeset/types.js";
import { Migrator } from "@monorepo/services/migrator.js";
import { pipe } from "effect";
import { forEach } from "effect/Array";
import { all, flatMap, tap } from "effect/Effect";
import { migrationNamePrompt } from "~programs/migration-name.js";

export const render = (changeset: Changeset[]) =>
	pipe(
		all([Migrator, migrationNamePrompt()]),
		flatMap(([migrator, migrationName]) =>
			migrator.renderChangesets(changeset, migrationName),
		),
		tap(() => {
			printWarnings(
				changeset.flatMap((c) => (c.warnings !== undefined ? c.warnings : [])),
			);
		}),
		tap((migration) =>
			forEach(migration, (migration) =>
				p.log.info(`Generated migration: ${migration}`),
			),
		),
	);
