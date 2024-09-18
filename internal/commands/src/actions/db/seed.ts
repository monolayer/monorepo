import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import { seed } from "@monorepo/programs/database/seed.js";
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
