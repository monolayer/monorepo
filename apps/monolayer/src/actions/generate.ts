import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { handleMissingDatabase } from "~/actions/database/handle-missing.js";
import { generateMigration } from "~/actions/migrations/generate.js";
import { handlePendingSchemaMigrations } from "~/actions/migrations/pending.js";
import { cliAction } from "~/cli-action.js";

export function generateAction(program: Command) {
	commandWithDefaultOptions({
		name: "generate",
		program: program,
	})
		.description("generate a schema migration")
		.action(async (opts) => {
			await cliAction("monolayer generate", opts, [
				handleMissingDatabase,
				handlePendingSchemaMigrations,
				generateMigration(),
			]);
		});
}
