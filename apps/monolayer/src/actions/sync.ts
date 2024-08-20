import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { handleMissingDatabase } from "@monorepo/programs/database/handle-missing.js";
import { applyMigrations } from "@monorepo/programs/migrations/apply.js";
import { generateMigration } from "@monorepo/programs/migrations/generate.js";
import { handlePendingSchemaMigrations } from "@monorepo/programs/migrations/pending.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import { Effect } from "effect";
import { cliAction } from "~monolayer/cli-action.js";

export function syncAction(program: Command) {
	commandWithDefaultOptions({
		name: "sync",
		program: program,
	})
		.description("generate a schema migration and migrate")
		.action(async (opts) => {
			await cliAction("Sync: generate migrations and migrate", opts, [
				handleMissingDatabase,
				handlePendingSchemaMigrations,
				TableRenameState.provide(generateMigration).pipe(
					Effect.tap((result) =>
						Effect.if(result.length !== 0, {
							onTrue: () => applyMigrations({ phase: "all" }),
							onFalse: () => Effect.succeed(true),
						}),
					),
				),
			]);
		});
}
