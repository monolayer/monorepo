#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { CommanderError } from "commander";
import { Effect } from "effect";
import { exit } from "process";
import { cliAction } from "~/cli/programs/cli-action.js";
import { createDatabase } from "~/cli/programs/create-database.js";
import { dropDatabase } from "~/cli/programs/drop-database.js";
import { dropTablesAndTypes } from "~/cli/programs/drop-tables-and-types.js";
import { dumpDatabaseStructure } from "~/cli/programs/dump-database-structure.js";
import { generateChangesetMigration } from "~/cli/programs/generate-changeset-migration.js";
import { handleMissingDevDatabase } from "~/cli/programs/handle-missing-dev-database.js";
import { handlePendingMigrations } from "~/cli/programs/handle-pending-migrations.js";
import { migrateDown } from "~/cli/programs/migrate-down.js";
import { migrate } from "~/cli/programs/migrate.js";
import { pendingMigrations } from "~/cli/programs/pending-migrations.js";
import { scaffoldMigration } from "~/cli/programs/scaffold-migration.js";
import { seed } from "~/cli/programs/seed.js";
import { structureLoad } from "~/cli/programs/structure-load.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command();

	program.name("yount").version("1.0.0");

	program
		.command("db:create")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"connection environment name as defined in connectors.ts",
			"development",
		)
		.description("create the database")
		.action(
			async (opts) =>
				await cliAction("yount db:create", opts, [createDatabase()]),
		);

	program
		.command("db:drop")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.description("drop the database")
		.action(
			async (opts) => await cliAction("yount db:drop", opts, [dropDatabase()]),
		);

	program
		.command("db:clear")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.description("remove tables and types")
		.action(
			async (opts) =>
				await cliAction("yount db:clear", opts, [
					dropTablesAndTypes(),
					dumpDatabaseStructure(),
				]),
		);

	program
		.command("migrate")
		.description("apply pending migrations")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount migrate", opts, [
				migrate().pipe(
					Effect.tap((result) =>
						Effect.if(result, {
							onTrue: dumpDatabaseStructure(),
							onFalse: Effect.succeed(true),
						}),
					),
				),
			]);
		});

	program
		.command("migrate:down")
		.description("migrate one step down")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount migrate:down", opts, [
				migrateDown().pipe(
					Effect.tap((result) =>
						Effect.if(result, {
							onTrue: dumpDatabaseStructure(),
							onFalse: Effect.succeed(true),
						}),
					),
				),
			]);
		});

	program
		.command("seed")
		.description("seed database")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.action(async (opts) => {
			await cliAction("yount seed", opts, [
				seed({ replant: opts.replant, disableWarnings: opts.disableWarnings }),
			]);
		});

	program
		.command("structure:dump")
		.description("dump the database structure")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount structure:dump", opts, [dumpDatabaseStructure()]);
		});

	program
		.command("structure:load")
		.description("load the database structure")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount structure load", opts, [structureLoad()]);
		});

	program
		.command("generate")
		.description("generate migrations based on the current defined schema")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.action(async (opts) => {
			await cliAction(
				"yount generate",
				{ environment: "development", connection: opts.connection },
				[
					handleMissingDevDatabase(),
					handlePendingMigrations(),
					generateChangesetMigration(),
				],
			);
		});

	program
		.command("pending")
		.description("list pending migrations")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in connectors.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount pending", opts, [pendingMigrations()]);
		});

	program
		.command("scaffold")
		.description("create an empty migration file")
		.action(async () => {
			await cliAction("yount scaffold", { environment: "development" }, [
				scaffoldMigration(),
			]);
		});

	program.exitOverride();

	try {
		program.parse();
	} catch (err) {
		if (isCommanderError(err) && err.code === "commander.help") {
			exit(0);
		}
	}
}

main().catch(console.error);
