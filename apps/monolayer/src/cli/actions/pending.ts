import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { pendingMigrations } from "~/migrations/pending.js";

export function pendingAction(program: Command) {
	program
		.command("pending")
		.description("list pending schema migrations")
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
			await cliAction("Pending migrations", opts, [pendingMigrations]);
		});
}
