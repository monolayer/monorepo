#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { exit } from "process";
import { migrationScaffold } from "~/cli/actions/migration-scaffold.js";
import { seed } from "~/cli/actions/seed.js";
import { dbClear } from "~/cli/commands/db-clear.js";
import { dbCreate } from "../cli/actions/db-create.js";
import { dbDrop } from "../cli/actions/db-drop.js";
import { generate } from "../cli/actions/generate.js";
import { migrateDown } from "../cli/actions/migrate-down.js";
import { migrate } from "../cli/actions/migrate.js";
import { pendingMigrations } from "../cli/actions/pending-migrations.js";
import { structureDump } from "../cli/actions/structure-dump.js";
import { structureLoad } from "../cli/actions/structure-load.js";
import { isCommanderError } from "../cli/command.js";

async function main() {
	const program = new Command();

	program.name("yount").version("1.0.0");

	program
		.command("db:create")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.description("create the database")
		.action(async (opts) => {
			await dbCreate(opts.environment);
		});

	program
		.command("db:drop")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.description("drop the database")
		.action(async (opts) => {
			await dbDrop(opts.environment);
		});

	program
		.command("db:clear")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.description("remove tables and types")
		.action(async (opts) => await dbClear(opts.environment));

	program
		.command("migrate")
		.description("apply pending migrations")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await migrate(opts.environment);
		});

	program
		.command("migrate:down")
		.description("migrate one step down")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await migrateDown(opts.environment);
		});

	program
		.command("seed")
		.description("seed database")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
		)
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.action(async (opts) => {
			await seed(opts);
		});

	program
		.command("structure:dump")
		.description("dump the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await structureDump(opts.environment);
		});

	program
		.command("structure:load")
		.description("load the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await structureLoad(opts.environment);
		});

	program
		.command("generate")
		.description("generate migrations based on the current defined schema")
		.option(
			"-f, --force",
			"generate migrations without warnings (destroys pending migration files)",
			false,
		)
		.action(async () => {
			await generate();
		});

	program
		.command("pending")
		.description("list pending migrations")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in yount.config.ts",
			"development",
		)
		.action(async (opts) => {
			await pendingMigrations(opts.environment);
		});

	program
		.command("scaffold")
		.description("create an empty migration file")
		.action(async () => {
			await migrationScaffold();
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
