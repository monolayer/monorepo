import type { Command } from "@commander-js/extra-typings";
import { Effect } from "effect";
import { cliAction } from "~/cli/cli-action.js";
import { handleMissingDatabase } from "~/database/handle-missing.js";
import { applyMigrations } from "~/migrations/apply.js";
import { generateMigration } from "~/migrations/generate.js";
import { handlePendingSchemaMigrations } from "~/migrations/pending.js";

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
			await cliAction("monolayer sync", opts, [
				handleMissingDatabase,
				handlePendingSchemaMigrations,
				generateMigration().pipe(
					Effect.tap((result) =>
						Effect.if(result.length !== 0, {
							onTrue: () => applyMigrations("all"),
							onFalse: () => Effect.succeed(true),
						}),
					),
				),
			]);
		});
}
