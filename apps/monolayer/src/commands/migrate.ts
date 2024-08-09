import type { Command } from "@commander-js/extra-typings";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { applyMigrations } from "~/actions/migrations/apply.js";
import { cliAction } from "~/cli-action.js";
import { rollback } from "../actions/migrations/rollback.js";
import { syncAction } from "../actions/sync.js";

export function migrateCommand(program: Command) {
	const migrate = program.command("migrate");

	migrate.description("Migrate commands");

	migrate
		.command("all")
		.description("migrate all pending migrations")
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
			await cliAction(
				"Migrate all pending migrations (expand, alter, data, contract)",
				opts,
				[applyMigrations({ phase: "all" })],
			);
		});

	migrate
		.command("alter")
		.description("migrate pending alter migrations")
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
			await cliAction("Migrate pending alter migrations", opts, [
				applyMigrations({
					phase: ChangesetPhase.Alter,
				}),
			]);
		});

	migrate
		.command("contract")
		.description("migrate pending contract migrations")
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
		.option("-m, --migration <migration-name-name>", "migration name")
		.action(async (opts) => {
			await cliAction("Migrate pending contract migrations", opts, [
				applyMigrations({
					phase: ChangesetPhase.Contract,
					migrationName: opts.migration,
				}),
			]);
		});

	migrate
		.command("expand")
		.description("migrate pending expand migrations")
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
			await cliAction("Migrate pending expand migrations", opts, [
				applyMigrations({ phase: ChangesetPhase.Expand }),
			]);
		});

	migrate
		.command("data")
		.description("migrate pending data migrations")
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
			await cliAction("Migrate pending data migrations", opts, [
				applyMigrations({ phase: ChangesetPhase.Data }),
			]);
		});

	migrate
		.command("rollback")
		.description("rollback to a previous migration")
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
			await cliAction("Rollback to a previous migration", opts, [rollback]);
		});

	syncAction(migrate);

	return migrate;
}
