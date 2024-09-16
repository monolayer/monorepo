#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { dbCommands } from "@monorepo/commands/commands/db.js";
import { migrationsCommand } from "@monorepo/commands/commands/migrations.js";
import { Command, CommanderError } from "commander";
import { exit } from "process";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command() as unknown as CommandExtra;

	program.name("monolayer").version("1.0.0");

	dbCommands(program);
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
