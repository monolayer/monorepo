#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { exit } from "process";
import { migrationScaffold } from "~/cli/actions/migration_scaffold.js";
import { seed } from "~/cli/actions/seed.js";
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

	const db = program
		.command("db")
		.description("perform database operations: create, drop, migrate");

	db.command("create")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.description("create the database")
		.action(async (opts) => {
			await dbCreate(opts.environment);
		});

	db.command("drop")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.description("drop the database")
		.action(async (opts) => {
			await dbDrop(opts.environment);
		});

	const dbMigrate = db
		.command("migrate")
		.description("database migration operations: latest, down");

	dbMigrate
		.command("latest")
		.description("apply pending migrations")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await migrate(opts.environment);
		});

	dbMigrate
		.command("down")
		.description("migrate one step down")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await migrateDown(opts.environment);
		});

	db.command("seed")
		.description("seed database")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
		)
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.action(async (opts) => {
			await seed(opts);
		});

	const structure = program
		.command("structure")
		.description("database structure operations: dump, load");

	structure
		.command("dump")
		.description("dump the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await structureDump(opts.environment);
		});

	structure
		.command("load")
		.description("load the database structure")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await structureLoad(opts.environment);
		});

	const migration = program
		.command("migration")
		.description("migration operations: generate, pending");

	migration
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

	migration
		.command("pending")
		.description("list pending migrations")
		.option(
			"-e, --environment <environment-name>",
			"environment as specified in kinetic.ts",
			"development",
		)
		.action(async (opts) => {
			await pendingMigrations(opts.environment);
		});

	migration
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
