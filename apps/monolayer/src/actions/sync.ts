import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { Effect } from "effect";
import { handleMissingDatabase } from "~/actions/database/handle-missing.js";
import { applyMigrations } from "~/actions/migrations/apply.js";
import { generateMigration } from "~/actions/migrations/generate.js";
import { handlePendingSchemaMigrations } from "~/actions/migrations/pending.js";
import { cliAction } from "~/cli-action.js";

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
				generateMigration().pipe(
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
