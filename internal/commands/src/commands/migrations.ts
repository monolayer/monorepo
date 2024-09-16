import type { Command } from "@commander-js/extra-typings";
import { applyAction } from "~commands/actions/apply.js";
import { generateAction } from "~commands/actions/generate.js";
import { pendingAction } from "~commands/actions/pending.js";
import { rollbackAction } from "~commands/actions/rollback.js";
import { scaffoldAction } from "~commands/actions/scaffold.js";

export function migrationsCommand(program: Command) {
	const migrations = program.command("migrations");

	migrations.description("Migrations commands");

	pendingAction(migrations);
	generateAction(migrations);
	scaffoldAction(migrations);
	applyAction(migrations);
	rollbackAction(migrations);
	return migrations;
}
