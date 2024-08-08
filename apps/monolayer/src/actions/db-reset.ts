import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { structureLoad } from "~/database/structure-load.js";

export function dbResetAction(program: Command) {
	program
		.command("db:reset")
		.description("Restores a database from its structure file")
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
			await cliAction("monolayer db:reset", opts, [structureLoad()]);
		});
}
