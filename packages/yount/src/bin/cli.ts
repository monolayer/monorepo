#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { CommanderError } from "commander";
import { Effect } from "effect";
import { exit } from "process";
import { createDatabase } from "~/database/create-database.js";
import { dropDatabase } from "~/database/drop-database.js";
import { handleMissingDatabase } from "~/database/handle-missing-dev-database.js";
import { cliAction } from "~/programs/cli-action.js";
import { migrate } from "~/programs/migrate.js";
import { rollback } from "~/programs/rollback.js";
import { seed } from "~/programs/seed.js";
import { structureLoad } from "~/programs/structure-load.js";
import { applyRevisions } from "~/revisions/apply-revisions.js";
import { generateRevision } from "~/revisions/generate-revision.js";
import { handlePendingSchemaRevisions } from "~/revisions/handle-pending-schema-revisions.js";
import { pendingRevisions } from "~/revisions/pending-revisions.js";
import { scaffoldRevision } from "~/revisions/scaffold-revision.js";

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
			await cliAction("yount pending", opts, [pendingRevisions()]);
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
				generateRevision().pipe(
					Effect.tap((result) =>
						Effect.if(result.length !== 0, {
							onTrue: () => applyRevisions(),
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
