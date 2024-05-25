import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { rollback } from "~/migrations/rollback.js";

export function rollbackAction(program: Command) {
	program
		.command("rollback")
		.description("rollback to a previous schema migration")
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
			await cliAction("monolayer rollback", opts, [rollback]);
		});
}
