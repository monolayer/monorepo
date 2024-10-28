#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { createDb } from "@monorepo/commands/actions/db/create.js";
import { dropDb } from "@monorepo/commands/actions/db/drop.js";
import { importDb } from "@monorepo/commands/actions/db/import.js";
import { resetDb } from "@monorepo/commands/actions/db/reset.js";
import { seedDb } from "@monorepo/commands/actions/db/seed.js";
import { applyAction } from "@monorepo/commands/actions/migrations/apply.js";
import { generateAction } from "@monorepo/commands/actions/migrations/generate.js";
import { pendingAction } from "@monorepo/commands/actions/migrations/pending.js";
import { rollbackAction } from "@monorepo/commands/actions/migrations/rollback.js";
import { scaffoldAction } from "@monorepo/commands/actions/migrations/scaffold.js";
import { dbCommand } from "@monorepo/commands/commands/db.js";
import { migrationsCommand } from "@monorepo/commands/commands/migrations.js";
import { Command, CommanderError } from "commander";
import { exit } from "process";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command() as unknown as CommandExtra;

	program.name("monolayer").version("1.0.0");

	const packageName = "@monolayer/pg";

	const db = dbCommand(program);
	createDb(db, packageName);
	dropDb(db, packageName);
	importDb(db, packageName);
	resetDb(db, packageName);
	seedDb(db, packageName);

	const migrations = migrationsCommand(program);
	pendingAction(migrations, packageName);
	generateAction(migrations, packageName);
	scaffoldAction(migrations, packageName);
	applyAction(migrations, packageName);
	rollbackAction(migrations, packageName);

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
