#!/usr/bin/env tsx

import { Command } from "commander";
import { exit } from "process";
import { isCommanderError } from "./command.js";
import { dbCreate } from "./commands/db_create.js";
import { dbDrop } from "./commands/db_drop.js";
import { initCommand } from "./commands/init.js";

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
