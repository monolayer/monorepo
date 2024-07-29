import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { scaffoldMigration } from "~/migrations/scaffold.js";
import { ChangesetPhase } from "../../changeset/types.js";

export function scaffoldCommand(program: Command) {
	const scaffold = program.command("scaffold");

	scaffold.description("Scaffold migration commands");

	scaffold
		.command("alter")
		.description(
			`Creates an empty alter migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration not to run in a transaction, use the --no-transaction flag.`,
		)
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-n, --no-transaction",
			"configure migration not to run in a transaction",
		)
		.action(async (opts) => {
			await cliAction(
				"Scaffold alter migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Alter, opts.transaction)],
			);
		});

	scaffold
		.command("contract")
		.description(
			`Creates an empty contract migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration not to run in a transaction, use the --no-transaction flag.`,
		)
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-n, --no-transaction",
			"configure migration not to run in a transaction",
		)
		.action(async (opts) => {
			await cliAction(
				"Scaffold contract migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Contract, opts.transaction)],
			);
		});

	scaffold
		.command("data")
		.description(
			`Creates an empty data migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration to run in a transaction, use the --transaction flag.`,
		)
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option("-t, --transaction", "configure migration to run in a transaction")
		.action(async (opts) => {
			await cliAction(
				"Scaffold data migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Data, opts.transaction ?? false)],
			);
		});

	scaffold
		.command("expand")
		.description(
			`Creates an empty expand migration file.

The migration will be configured to run in a transaction by default.

If you want to configure the migration not to run in a transaction, use the --no-transaction flag.`,
		)
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-n, --no-transaction",
			"configure migration not to run in a transaction",
		)
		.action(async (opts) => {
			await cliAction(
				"Scaffold expand migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Alter, opts.transaction)],
			);
		});

	return scaffold;
}
