#!/usr/bin/env tsx

import { Command } from "@commander-js/extra-typings";
import { CommanderError } from "commander";
import { exit } from "process";
import { dbCreateAction } from "~/cli-actions/db-create.js";
import { dbDropAction } from "~/cli-actions/db-drop.js";
import { dbResetAction } from "~/cli-actions/db-reset.js";
import { generateAction } from "~/cli-actions/generate.js";
import { importSchemaAction } from "~/cli-actions/import-schema.js";
import { migrateAction } from "~/cli-actions/migrate.js";
import { pendingAction } from "~/cli-actions/pending.js";
import { rollbackAction } from "~/cli-actions/rollback.js";
import { scaffoldAction } from "~/cli-actions/scaffold.js";
import { seedAction } from "~/cli-actions/seed.js";
import { syncAction } from "~/cli-actions/sync.js";
import { migrateAlterAction } from "../cli-actions/migrate-alter.js";
import { migrateContractAction } from "../cli-actions/migrate-contract.js";
import { migrateExpandAction } from "../cli-actions/migrate-expand.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	const program = new Command();

	program.name("monolayer").version("1.0.0");

	dbCreateAction(program);
	dbDropAction(program);
	dbResetAction(program);
	generateAction(program);
	importSchemaAction(program);
	pendingAction(program);
	migrateAction(program);
	migrateExpandAction(program);
	migrateAlterAction(program);
	migrateContractAction(program);
	rollbackAction(program);
	scaffoldAction(program);
	seedAction(program);
	syncAction(program);

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
