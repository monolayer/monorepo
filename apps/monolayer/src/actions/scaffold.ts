import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { scaffoldMigration } from "~/actions/migrations/scaffold.js";
import { cliAction } from "~/cli-action.js";

export function scaffoldCommand(program: Command) {
	const scaffold = program.command("scaffold");

	scaffold.description("Scaffold migration commands");

	commandWithDefaultOptions({
		name: "alter",
		program: scaffold,
	})
		.option(
			"-n, --no-transaction",
			"configure migration not to run in a transaction",
		)
		.description(
			`Creates an empty alter migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration not to run in a transaction, use the --no-transaction flag.`,
		)
		.action(async (opts) => {
			await cliAction("Scaffold alter migration", opts, [
				scaffoldMigration(ChangesetPhase.Alter, opts.transaction),
			]);
		});

	commandWithDefaultOptions({
		name: "contract",
		program: scaffold,
	})
		.description(
			`Creates an empty contract migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration not to run in a transaction, use the --no-transaction flag.`,
		)
		.option(
			"-n, --no-transaction",
			"configure migration not to run in a transaction",
		)
		.action(async (opts) => {
			await cliAction("Scaffold contract migration", opts, [
				scaffoldMigration(ChangesetPhase.Contract, opts.transaction),
			]);
		});

	commandWithDefaultOptions({
		name: "data",
		program: scaffold,
	})
		.description(
			`Creates an empty data migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration to run in a transaction, use the --transaction flag.`,
		)
		.option("-t, --transaction", "configure migration to run in a transaction")
		.action(async (opts) => {
			await cliAction("Scaffold data migration", opts, [
				scaffoldMigration(ChangesetPhase.Data, opts.transaction ?? false),
			]);
		});

	commandWithDefaultOptions({
		name: "expand",
		program: scaffold,
	})
		.description(
			`Creates an empty expand migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration not to run in a transaction, use the --no-transaction flag.`,
		)
		.option(
			"-n, --no-transaction",
			"configure migration not to run in a transaction",
		)
		.action(async (opts) => {
			await cliAction("Scaffold expand migration", opts, [
				scaffoldMigration(ChangesetPhase.Expand, opts.transaction),
			]);
		});

	return scaffold;
}
