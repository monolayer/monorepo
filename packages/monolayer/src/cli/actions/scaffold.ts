import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { scaffoldMigration } from "~/migrations/scaffold.js";
import { ChangesetPhase } from "../../changeset/types.js";

export function scaffoldCommand(program: Command) {
	const scaffold = program.command("scaffold");

	scaffold.description("Scaffold migration commands");

	scaffold
		.command("alter")
		.description("creates an empty alter migration file")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.action(async (opts) => {
			await cliAction(
				"Scaffold alter migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Alter)],
			);
		});

	scaffold
		.command("contract")
		.description("creates an empty contract migration file")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.action(async (opts) => {
			await cliAction(
				"Scaffold contract migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Contract)],
			);
		});

	scaffold
		.command("data")
		.description("creates an empty data migration file")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.action(async (opts) => {
			await cliAction(
				"Scaffold data migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Data)],
			);
		});

	scaffold
		.command("expand")
		.description("creates an empty expand migration file")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.action(async (opts) => {
			await cliAction(
				"Scaffold expand migration",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Alter)],
			);
		});

	return scaffold;
}
