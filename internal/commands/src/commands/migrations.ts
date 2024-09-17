import type { Command } from "@commander-js/extra-typings";
import { applyAction } from "~commands/actions/apply.js";
import { generateAction } from "~commands/actions/generate.js";
import { pendingAction } from "~commands/actions/pending.js";
import { rollbackAction } from "~commands/actions/rollback.js";
import { scaffoldAction } from "~commands/actions/scaffold.js";

export function migrationsCommand(program: Command, packageName: string) {
	const migrations = program.command("migrations");

	migrations.description("Migrations commands");

	pendingAction(migrations, packageName);
	generateAction(migrations, packageName);
	scaffoldAction(migrations, packageName);
	applyAction(migrations, packageName);
	rollbackAction(migrations, packageName);
	return migrations;
}
