import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { scaffoldMigration } from "@monorepo/programs/migrations/scaffold.js";
import {
	PackageNameState,
	makePackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { exit } from "node:process";
import { cliAction } from "~commands/cli-action.js";

export function scaffoldAction(program: Command, packageName: string) {
	return commandWithDefaultOptions({
		name: "scaffold",
		program: program,
	})
		.description(
			`Creates an empty expand migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration not to run in a transaction, use the --no-transaction flag.`,
		)
		.requiredOption(
			"-p, --phase <name>",
			"Phase to scaffold (alter | contract | data | expand)",
			(value) =>
				["alter", "contract", "data", "expand"].includes(value)
					? value
					: "none",
		)
		.option(
			"-n, --no-transaction",
			"configure migration not to run in a transaction",
		)
		.action(async (opts) => {
			if (validPhase(opts.phase)) {
				await cliAction(`Scaffold ${opts.phase} migration`, opts, [
					Effect.provide(
						scaffoldMigration(opts.phase, opts.transaction),
						Layer.effect(PackageNameState, makePackageNameState(packageName)),
					),
				]);
			}
		});
}

function validPhase(phase: string): phase is ChangesetPhase {
	if (phase === "none") {
		console.log(
			"error: invalid phase: should be one of `expand`, `alter`, `data`, `contract`.",
		);
		exit(1);
	}
	return [
		ChangesetPhase.Alter.toString(),
		ChangesetPhase.Contract.toString(),
		ChangesetPhase.Data.toString(),
		ChangesetPhase.Expand.toString(),
	].includes(phase);
}
