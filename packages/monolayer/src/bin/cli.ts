#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { CommanderError } from "commander";
import { Effect } from "effect";
import { exit } from "process";
import { cliAction } from "~/cli/cli-action.js";
import { createDatabase } from "~/database/create.js";
import { dropDatabase } from "~/database/drop.js";
import { handleMissingDatabase } from "~/database/handle-missing.js";
import { seed } from "~/database/seed.js";
import { structureLoad } from "~/database/structure-load.js";
import { applyMigrations, migrate } from "~/migrations/apply.js";
import { generateMigration } from "~/migrations/generate.js";
import {
	handlePendingSchemaMigrations,
	pendingMigrations,
} from "~/migrations/pending.js";
import { rollback } from "~/migrations/rollback.js";
import { scaffoldMigration } from "~/migrations/scaffold.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command();

	program.name("monolayer").version("1.0.0");

	program
		.command("db:create")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.description("creates a database")
		.action(
			async (opts) =>
				await cliAction("monolayer db:create", opts, [createDatabase()]),
		);

	program
		.command("db:drop")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.description("drops a database")
		.action(
			async (opts) =>
				await cliAction("monolayer db:drop", opts, [dropDatabase()]),
		);

	program
		.command("generate")
		.description("generate a schema migration")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer generate", opts, [
				handleMissingDatabase(),
				handlePendingSchemaMigrations(),
				generateMigration(),
			]);
		});

	program
		.command("pending")
		.description("list pending schema migrations")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer pending", opts, [pendingMigrations()]);
		});

	program
		.command("migrate")
		.description("migrate pending schema migrations")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer migrate", opts, [migrate()]);
		});

	program
		.command("rollback")
		.description("rollback to a previous schema migration")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer rollback", opts, [rollback()]);
		});

	program
		.command("scaffold")
		.description("creates an empty schema migration file")
		.action(async () => {
			await cliAction("monolayer scaffold", { environment: "development" }, [
				scaffoldMigration(),
			]);
		});

	program
		.command("seed")
		.description("seeds a database")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.option("-f, --file <seed-file-name>", "seed file", "seed.ts")
		.action(async (opts) => {
			await cliAction("monolayer seed", opts, [
				seed({
					replant: opts.replant,
					disableWarnings: opts.disableWarnings,
					seedFile: opts.file,
				}),
			]);
		});

	program
		.command("structure:load")
		.description("loads a database structure")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer structure load", opts, [structureLoad()]);
		});

	program
		.command("sync")
		.description("generate a schema migration and migrate")
		.option(
			"-c, --configuration <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"configuration environment name as defined in configuration.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer sync", opts, [
				handleMissingDatabase(),
				handlePendingSchemaMigrations(),
				generateMigration().pipe(
					Effect.tap((result) =>
						Effect.if(result.length !== 0, {
							onTrue: () => applyMigrations(),
							onFalse: () => Effect.succeed(true),
						}),
					),
				),
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
