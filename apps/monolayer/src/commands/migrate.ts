import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { applyMigrations } from "~/actions/migrations/apply.js";
import { cliAction } from "~/cli-action.js";
import { rollback } from "../actions/migrations/rollback.js";
import { syncAction } from "../actions/sync.js";

export function migrateCommand(program: Command) {
	const migrate = program.command("migrate");

	migrate.description("Migrate commands");

	commandWithDefaultOptions({
		name: "all",
		program: migrate,
	})
		.description("migrate all pending migrations")
		.action(async (opts) => {
			await cliAction(
				"Migrate all pending migrations (expand, alter, data, contract)",
				opts,
				[applyMigrations({ phase: "all" })],
			);
		});

	commandWithDefaultOptions({
		name: "alter",
		program: migrate,
	})
		.description("migrate pending alter migrations")
		.action(async (opts) => {
			await cliAction("Migrate pending alter migrations", opts, [
				applyMigrations({
					phase: ChangesetPhase.Alter,
				}),
			]);
		});

	commandWithDefaultOptions({
		name: "contract",
		program: migrate,
	})
		.description("migrate pending contract migrations")
		.option("-m, --migration <migration-name-name>", "migration name")
		.action(async (opts) => {
			await cliAction("Migrate pending contract migrations", opts, [
				applyMigrations({
					phase: ChangesetPhase.Contract,
					migrationName: opts.migration,
				}),
			]);
		});

	commandWithDefaultOptions({
		name: "expand",
		program: migrate,
	})
		.description("migrate pending expand migrations")
		.action(async (opts) => {
			await cliAction("Migrate pending expand migrations", opts, [
				applyMigrations({ phase: ChangesetPhase.Expand }),
			]);
		});

	commandWithDefaultOptions({
		name: "data",
		program: migrate,
	})
		.description("migrate pending data migrations")
		.action(async (opts) => {
			await cliAction("Migrate pending data migrations", opts, [
				applyMigrations({ phase: ChangesetPhase.Data }),
			]);
		});

	commandWithDefaultOptions({
		name: "rollback",
		program: migrate,
	})
		.description("rollback to a previous migration")
		.action(async (opts) => {
			await cliAction("Rollback to a previous migration", opts, [rollback]);
		});

	syncAction(migrate);

	return migrate;
}
