#!/usr/bin/env node --loader ts-node/esm --no-warnings

import { Command } from "commander";
import { exit } from "process";
import { isCommanderError } from "./command.js";
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
