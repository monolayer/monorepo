import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import { createDatabase } from "@monorepo/programs/database/create-database.js";
import { dropDatabase } from "@monorepo/programs/database/drop-database.js";
import { seed } from "@monorepo/programs/database/seed.js";
import { structureLoad } from "@monorepo/programs/database/structure-load.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import { cliAction, cliActionWithoutContext } from "~monolayer/cli-action.js";
import { importSchema } from "../actions/import-schema.js";

export function dbCommand(program: Command) {
	const db = program.command("db");

	db.description("Database commands");

	commandWithDefaultOptions({
		name: "create",
		program: db,
	})
		.description("creates a database")
		.action(
			async (opts) =>
				await cliAction("Create Database", opts, [createDatabase]),
		);

	commandWithDefaultOptions({
		name: "drop",
		program: db,
	})
		.description("drops a database")
		.action(
			async (opts) => await cliAction("Drop Database", opts, [dropDatabase]),
		);

	commandWithDefaultOptions({
		name: "reset",
		program: db,
	})
		.description("Restores a database from its structure file")
		.action(async (opts) => {
			await cliAction("Reset Database", opts, [structureLoad()]);
		});

	db.command("import")
		.description("imports schema")
		.action(async () => {
			await cliActionWithoutContext("Import database", [importSchema]);
		});

	commandWithDefaultOptions({
		name: "seed",
		program: db,
	})
		.description("seeds a database")
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.option("-f, --file <seed-file-name>", "seed file", "seed.ts")
		.action(async (opts) => {
			await cliAction("monolayer seed", opts, [
				ChangesetGeneratorState.provide(
					TableRenameState.provide(
						seed({
							replant: opts.replant,
							disableWarnings: opts.disableWarnings,
							seedFile: opts.file,
						}),
					),
				),
			]);
		});

	return db;
}
