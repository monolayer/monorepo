#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { dataCLI } from "@monorepo/data/cli.js";
import { createDb } from "@monorepo/db/actions/db/create.js";
import { dropDb } from "@monorepo/db/actions/db/drop.js";
import { importDb } from "@monorepo/db/actions/db/import.js";
import { resetDb } from "@monorepo/db/actions/db/reset.js";
import { dbCommand } from "@monorepo/db/commands/db.js";
import { syncDb } from "@monorepo/push/actions/db-sync.js";
import { pushToDb } from "@monorepo/push/actions/push-to-db.js";
import { Command, CommanderError } from "commander";
import { exit } from "process";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command() as unknown as CommandExtra;

	program.name("monolayer").version("1.0.0");

	const db = dbCommand(program);
	createDb(db);
	dropDb(db);
	importDb(db);
	resetDb(db);
	const push = program.command("push");
	push.description("Push commands");
	pushToDb(push);
	syncDb(push);
	dataCLI(program);

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
