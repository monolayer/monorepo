import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { applyMigrations } from "~/migrations/apply.js";
import { ChangesetPhase } from "../changeset/types.js";

export function migrateContractAction(program: Command) {
	program
		.command("migrate:contract")
		.description("migrate pending contract schema migrations")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-c, --connection <connection-name>",
			"configuration connection name as defined in configuration.ts",
			"development",
		)
		.option("-m, --migration <migration-name-name>", "migration name")
		.action(async (opts) => {
			await cliAction("monolayer migrate contract", opts, [
				applyMigrations({
					phase: ChangesetPhase.Contract,
					migrationName: opts.migration,
				}),
			]);
		});
}
