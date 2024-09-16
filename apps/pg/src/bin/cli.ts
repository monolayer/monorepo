#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { Command, CommanderError } from "commander";
import { exit } from "process";
import { dbCommands } from "../commands/db.js";
import { migrationsCommand } from "../commands/migrations.js";

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
