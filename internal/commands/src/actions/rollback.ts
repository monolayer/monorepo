import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { rollback } from "@monorepo/programs/migrations/rollback.js";
import { cliAction } from "~commands/cli-action.js";

export function rollbackAction(program: Command) {
	return commandWithDefaultOptions({
		name: "rollback",
		program: program,
	})
		.description("Rollback applied migrations to a previous base migration.")
		.action(async (opts) => {
			await cliAction("Rollback", opts, [rollback]);
		});
}
