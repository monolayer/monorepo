import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { scaffoldMigration } from "~/migrations/scaffold.js";
import { ChangesetPhase } from "../../changeset/types.js";

export function scaffoldCommand(program: Command) {
	const scaffold = program.command("scaffold");

	scaffold.description("Scaffold migration commands");

	scaffold
		.command("alter")
		.description("creates an empty schema migration file")
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
		.command("data")
		.description("creates an empty schema migration file")
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

	return scaffold;
}

export function scaffoldDataAction(program: Command) {
	program
		.command("scaffold:data")
		.description("creates an empty schema migration file")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.action(async (opts) => {
			await cliAction(
				"monolayer scaffold",
				{ ...opts, connection: "development" },
				[scaffoldMigration(ChangesetPhase.Data)],
			);
		});
}

