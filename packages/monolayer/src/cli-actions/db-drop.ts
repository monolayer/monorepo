import type { Command } from "@commander-js/extra-typings";
import { cliAction } from "~/cli/cli-action.js";
import { dropDatabase } from "~/database/drop.js";

export function dbDropAction(program: Command) {
	program
		.command("db:drop")
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
		.description("drops a database")
		.action(
			async (opts) =>
				await cliAction("monolayer db:drop", opts, [dropDatabase()]),
		);
}
