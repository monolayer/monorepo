import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { applyMigrations } from "@monorepo/programs/migrations/apply.js";
import { rollback } from "@monorepo/programs/migrations/rollback.js";
import { cliAction } from "~monolayer/cli-action.js";

export function applyCommands(program: Command) {
	const apply = program.command("apply");

	apply.description("Apply migration commands");

	commandWithDefaultOptions({
		name: "all",
		program: apply,
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
		program: apply,
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
		program: apply,
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
		program: apply,
	})
		.description("migrate pending expand migrations")
		.action(async (opts) => {
			await cliAction("Migrate pending expand migrations", opts, [
				applyMigrations({ phase: ChangesetPhase.Expand }),
			]);
		});

	commandWithDefaultOptions({
		name: "data",
		program: apply,
	})
		.description("migrate pending data migrations")
		.action(async (opts) => {
			await cliAction("Migrate pending data migrations", opts, [
				applyMigrations({ phase: ChangesetPhase.Data }),
			]);
		});

	commandWithDefaultOptions({
		name: "rollback",
		program: apply,
	})
		.description("rollback to a previous migration")
		.action(async (opts) => {
			await cliAction("Rollback to a previous migration", opts, [rollback]);
		});

	return apply;
}
