#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { CommanderError } from "commander";
import { Effect } from "effect";
import { exit } from "process";
import { applyRevisions } from "~/programs/apply-revisions.js";
import { cliAction } from "~/programs/cli-action.js";
import { createDatabase } from "~/programs/create-database.js";
import { dropDatabase } from "~/programs/drop-database.js";
import { generateRevision } from "~/programs/generate-revision.js";
import { handleMissingDatabase } from "~/programs/handle-missing-dev-database.js";
import { handlePendingSchemaRevisions } from "~/programs/handle-pending-schema-revisions.js";
import { migrate } from "~/programs/migrate.js";
import { pendingMigrations } from "~/programs/pending-migrations.js";
import { rollback } from "~/programs/rollback.js";
import { scaffoldRevision } from "~/programs/scaffold-revision.js";
import { seed } from "~/programs/seed.js";
import { structureLoad } from "~/programs/structure-load.js";

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
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"connection environment name as defined in configuration.ts",
			"development",
		)
		.description("creates a database")
		.action(
			async (opts) =>
				await cliAction("yount db:create", opts, [createDatabase()]),
		);

	program
		.command("db:drop")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.description("drops a database")
		.action(
			async (opts) => await cliAction("yount db:drop", opts, [dropDatabase()]),
		);

	program
		.command("generate")
		.description("generate schema revisions")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount generate", opts, [
				handleMissingDatabase(),
				handlePendingSchemaRevisions(),
				generateRevision(),
			]);
		});

	program
		.command("pending")
		.description("list pending schema revisions")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
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
		.command("push")
		.description("push pending schema revisions")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount push", opts, [migrate()]);
		});

	program
		.command("rollback")
		.description("rollback to a previous schema revision")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount rollback", opts, [rollback()]);
		});

	program
		.command("scaffold")
		.description("creates an empty schema revision file")
		.action(async () => {
			await cliAction("yount scaffold", { environment: "development" }, [
				scaffoldRevision(),
			]);
		});

	program
		.command("seed")
		.description("seeds a database")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.option("-f, --file <seed-file-name>", "seed file", "seed.ts")
		.action(async (opts) => {
			await cliAction("yount seed", opts, [
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
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
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
		.command("sync")
		.description("generates schema revisions and pushes them")
		.option(
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("yount sync", opts, [
				handleMissingDatabase(),
				handlePendingSchemaRevisions(),
				generateRevision().pipe(Effect.tap(applyRevisions)),
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
