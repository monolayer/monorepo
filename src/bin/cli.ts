#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { exit } from "process";
import { seed } from "~/cli/actions/seed.js";
import { autopilotRevert } from "../cli/actions/autopilot_revert.js";
import { dbCreate } from "../cli/actions/db_create.js";
import { dbDrop } from "../cli/actions/db_drop.js";
import { generate } from "../cli/actions/generate.js";
import { initCommand } from "../cli/actions/init.js";
import { migrate } from "../cli/actions/migrate.js";
import { migrateDown } from "../cli/actions/migrate_down.js";
import { pendingMigrations } from "../cli/actions/pending_migrations.js";
import { structureDump } from "../cli/actions/structure_dump.js";
import { structureLoad } from "../cli/actions/structure_load.js";
import { isCommanderError } from "../cli/command.js";

async function main() {
	const program = new Command();

	program.name("kinetic").version("1.0.0");

	program
		.command("init")
		.description("initialize kinetic in a project")
		.action(async () => {
			await initCommand();
		});

	program
		.command("db:create")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.description("Create the database")
		.action(async (opts) => {
			await dbCreate(opts.environment);
		});

	program
		.command("db:drop")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.description("Drop the database")
		.action(async (opts) => {
			await dbDrop(opts.environment);
		});

	program
		.command("seed")
		.description("Seed database")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
		)
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.action(async (opts) => {
			await seed(opts);
		});

	program
		.command("structure:dump")
		.description("Dump the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await structureDump(opts.environment);
		});

	program
		.command("structure:load")
		.description("Load the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await structureLoad(opts.environment);
		});

	program
		.command("generate")
		.description("Generate migrations based on the current defined schema")
		.option(
			"-f, --force",
			"generate migrations without warnings (destroys pending migration files)",
			false,
		)
		.action(async () => {
			await generate();
		});

	program
		.command("migrate")
		.description("Apply pending migrations")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await migrate(opts.environment);
		});

	program
		.command("migrate:down")
		.description("Migrate one step down")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await migrateDown(opts.environment);
		});

	program
		.command("migrate:pending")
		.description("List pending migrations")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await pendingMigrations(opts.environment);
		});

	program
		.command("autopilot:revert")
		.description("Revert autopilot migrations")
		.action(async () => {
			await autopilotRevert();
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
