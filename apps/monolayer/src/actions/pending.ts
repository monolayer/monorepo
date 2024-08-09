import type { Command } from "@commander-js/extra-typings";
import { pendingMigrations } from "~/actions/migrations/pending.js";
import { cliAction } from "~/cli-action.js";

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
