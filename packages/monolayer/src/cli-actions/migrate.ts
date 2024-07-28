import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { applyMigrations } from "~/migrations/apply.js";

export function migrateAction(program: Command) {
	program
		.command("migrate")
		.description("migrate pending schema migrations")
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
			await cliAction("monolayer migrate", opts, [
				applyMigrations({ phase: "all" }),
			]);
		});
}
