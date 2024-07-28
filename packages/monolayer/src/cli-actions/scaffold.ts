import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { scaffoldMigration } from "~/migrations/scaffold.js";
import { ChangesetPhase } from "../changeset/types.js";

export function scaffoldAlterAction(program: Command) {
	program
		.command("scaffold:alter")
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
				[scaffoldMigration(ChangesetPhase.Alter)],
			);
		});
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
