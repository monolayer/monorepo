#!/usr/bin/env tsx

import { Command } from "commander";
import { exit } from "process";
import { dbCreate } from "./actions/db_create.js";
import { dbDrop } from "./actions/db_drop.js";
import { generate } from "./actions/generate.js";
import { initCommand } from "./actions/init.js";
import { migrate } from "./actions/migrate.js";
import { migrateDown } from "./actions/migrate_down.js";
import { pendingMigrations } from "./actions/pending_migrations.js";
import { structureDump } from "./actions/structure_dump.js";
import { structureLoad } from "./actions/structure_load.js";
import { isCommanderError } from "./command.js";

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
		.action(async (_opts, cmd) => {
			await dbCreate(cmd.opts().environment);
		});

	program
		.command("db:drop")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.description("Drop the database")
		.action(async (_opts, cmd) => {
			await dbDrop(cmd.opts().environment);
		});

	program
		.command("structure:dump")
		.description("Dump the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (_opts, cmd) => {
			await structureDump(cmd.opts().environment);
		});

	program
		.command("structure:load")
		.description("Load the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (_opts, cmd) => {
			await structureLoad(cmd.opts().environment);
		});

	program
		.command("generate")
		.description("Generate migrations based on the current defined schema")
		.option(
			"-f, --force",
			"generate migrations without warnings (destroys pending migration files)",
			false,
		)
		.action(async (_opts, _cmd) => {
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
		.action(async (_opts, cmd) => {
			await migrate(cmd.opts().environment);
		});

	program
		.command("migrate:down")
		.description("Migrate one step down")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (_opts, cmd) => {
			await migrateDown(cmd.opts().environment);
		});

	program
		.command("migrate:pending")
		.description("List pending migrations")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (_opts, cmd) => {
			await pendingMigrations(cmd.opts().environment);
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
