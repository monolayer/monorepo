#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { CommanderError } from "commander";
import { exit } from "process";
import { dbCommand } from "../cli/commands/db.js";
import { migrateCommand } from "../cli/commands/migrate.js";
import { migrationsCommand } from "../cli/commands/migrations.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command();

	program.name("monolayer").version("1.0.0");

	dbCommand(program);
	migrateCommand(program);
	migrationsCommand(program);

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
