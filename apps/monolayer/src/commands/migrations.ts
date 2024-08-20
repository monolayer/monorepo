import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import { handleMissingDatabase } from "@monorepo/programs/database/handle-missing.js";
import { generateMigration } from "@monorepo/programs/migrations/generate.js";
import {
	handlePendingSchemaMigrations,
	logPendingMigrations,
} from "@monorepo/programs/migrations/pending.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import { cliAction } from "~monolayer/cli-action.js";
import { scaffoldCommand } from "../actions/scaffold.js";

export function migrationsCommand(program: Command) {
	const migrations = program.command("migrations");

	migrations.description("Migrations commands");

	scaffoldCommand(migrations);

	commandWithDefaultOptions({
		name: "pending",
		program: program,
	})
		.description("list pending schema migrations")
		.action(async (opts) => {
			await cliAction("Pending migrations", opts, [logPendingMigrations]);
		});

	commandWithDefaultOptions({
		name: "generate",
		program: program,
	})
		.description("generate a schema migration")
		.action(async (opts) => {
			await cliAction("monolayer generate", opts, [
				handleMissingDatabase,
				handlePendingSchemaMigrations,
				ChangesetGeneratorState.provide(
					TableRenameState.provide(generateMigration),
				),
			]);
		});

	return migrations;
}
