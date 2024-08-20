import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { handleMissingDatabase } from "@monorepo/programs/database/handle-missing.js";
import { generateMigration } from "@monorepo/programs/migrations/generate.js";
import { handlePendingSchemaMigrations } from "@monorepo/programs/migrations/pending.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import { cliAction } from "~monolayer/cli-action.js";

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
				TableRenameState.provide(generateMigration),
			]);
		});
}
