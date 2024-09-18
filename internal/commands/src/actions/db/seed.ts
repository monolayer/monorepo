import * as p from "@clack/prompts";
import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import {
	checkPendingMigrations,
	checkPendingSchemaChanges,
	replantWarning,
	seedDatabase,
	truncateAllTables,
} from "@monorepo/programs/database/seed-database.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliAction } from "~commands/cli-action.js";

export function seedDb(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "seed",
		program: program,
	})
		.description("seeds a database")
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-n, --disable-warnings", "disable truncation warnings")
		.action(async (opts) => {
			await cliAction("monolayer seed", opts, [
				ChangesetGeneratorState.provide(
					TableRenameState.provide(
						Effect.provide(
							seed({
								replant: opts.replant,
								disableWarnings: opts.disableWarnings,
							}),
							Layer.effect(PackageNameState, makePackageNameState(packageName)),
						),
					),
				),
			]);
		});
}

type SeedOptions = {
	disableWarnings?: boolean;
	replant?: boolean;
};

export function seed({ disableWarnings, replant }: SeedOptions) {
	return Effect.gen(function* () {
		p.log.message(
			`${replant ? "Truncate tables and seed database" : "Seed Database"}`,
		);
		yield* checkPendingMigrations;
		yield* checkPendingSchemaChanges;

		if (!!replant && !disableWarnings) yield* replantWarning;
		if (replant) yield* truncateAllTables;

		yield* seedDatabase;
	});
}
