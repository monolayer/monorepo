import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { pendingMigrations } from "~/actions/migrations/pending.js";
import { cliAction } from "~/cli-action.js";

export function pendingAction(program: Command) {
	commandWithDefaultOptions({
		name: "pending",
		program: program,
	})
		.description("list pending schema migrations")
		.action(async (opts) => {
			await cliAction("Pending migrations", opts, [pendingMigrations]);
		});
}
