import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { applyMigrations } from "~/migrations/apply.js";
import { ChangesetPhase } from "../changeset/types.js";

export function migrateExpandAction(program: Command) {
	program
		.command("migrate:expand")
		.description("migrate pending expand schema migrations")
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
		.action(async (opts) => {
			await cliAction("monolayer migrate expand", opts, [
				applyMigrations({ phase: ChangesetPhase.Expand }),
			]);
		});
}
