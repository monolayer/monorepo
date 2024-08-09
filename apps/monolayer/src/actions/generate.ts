import type { Command } from "@commander-js/extra-typings";
import { handleMissingDatabase } from "~/actions/database/handle-missing.js";
import { generateMigration } from "~/actions/migrations/generate.js";
import { handlePendingSchemaMigrations } from "~/actions/migrations/pending.js";
import { cliAction } from "~/cli-action.js";

export function generateAction(program: Command) {
	program
		.command("generate")
		.description("generate a schema migration")
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
			await cliAction("monolayer generate", opts, [
				handleMissingDatabase,
				handlePendingSchemaMigrations,
				generateMigration(),
			]);
		});
}
