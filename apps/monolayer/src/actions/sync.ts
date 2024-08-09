import type { Command } from "@commander-js/extra-typings";
import { Effect } from "effect";
import { handleMissingDatabase } from "~/actions/database/handle-missing.js";
import { applyMigrations } from "~/actions/migrations/apply.js";
import { generateMigration } from "~/actions/migrations/generate.js";
import { handlePendingSchemaMigrations } from "~/actions/migrations/pending.js";
import { cliAction } from "~/cli-action.js";

export function syncAction(program: Command) {
	program
		.command("sync")
		.description("generate a schema migration and migrate")
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
