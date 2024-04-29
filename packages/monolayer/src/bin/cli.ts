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
import { applyRevisions, migrate } from "~/revisions/apply.js";
import { generateRevision } from "~/revisions/generate.js";
import {
	handlePendingSchemaRevisions,
	pendingRevisions,
} from "~/revisions/pending.js";
import { rollback } from "~/revisions/rollback.js";
import { scaffoldRevision } from "~/revisions/scaffold.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command();

	program.name("monolayer").version("1.0.0");

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
				await cliAction("monolayer db:create", opts, [createDatabase()]),
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
			"environment as specified in monolayer.config.ts",
			"development",
		)
		.description("drops a database")
		.action(
			async (opts) =>
				await cliAction("monolayer db:drop", opts, [dropDatabase()]),
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
			"environment as specified in monolayer.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer generate", opts, [
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
			"environment as specified in monolayer.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer pending", opts, [pendingRevisions()]);
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
			"environment as specified in monolayer.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer push", opts, [migrate()]);
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
			"environment as specified in monolayer.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer rollback", opts, [rollback()]);
		});

	program
		.command("scaffold")
		.description("creates an empty schema revision file")
		.action(async () => {
			await cliAction("monolayer scaffold", { environment: "development" }, [
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
			"environment as specified in monolayer.config.ts",
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
			"-c, --connection <connection-name>",
			"connection name as defined in configuration.ts",
			"default",
		)
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in monolayer.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer structure load", opts, [structureLoad()]);
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
			"environment as specified in monolayer.config.ts",
			"development",
		)
		.action(async (opts) => {
			await cliAction("monolayer sync", opts, [
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
