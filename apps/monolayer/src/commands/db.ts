import type { Command } from "@commander-js/extra-typings";
import { createDatabase } from "~/actions/database/create.js";
import { cliAction, cliActionWithoutContext } from "~/cli-action.js";
import { dropDatabase } from "../actions/database/drop.js";
import { seed } from "../actions/database/seed.js";
import { structureLoad } from "../actions/database/structure-load.js";
import { importSchema } from "../actions/import-schema.js";

export function dbCommand(program: Command) {
	const db = program.command("db");

	db.description("Database commands");

	db.command("create")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-c, --connection <connection-name>",
			"configuration connection name as defined in configuration.ts",
			"development",
		)
		.description("creates a database")
		.action(
			async (opts) =>
				await cliAction("Create Database", opts, [createDatabase]),
		);

	db.command("drop")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-c, --connection <connection-name>",
			"configuration connection name as defined in configuration.ts",
			"development",
		)
		.description("drops a database")
		.action(
			async (opts) => await cliAction("Drop Database", opts, [dropDatabase()]),
		);

	db.command("reset")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-c, --connection <connection-name>",
			"configuration connection name as defined in configuration.ts",
			"development",
		)
		.description("Restores a database from its structure file")
		.action(async (opts) => {
			await cliAction("Reset Database", opts, [structureLoad()]);
		});

	db.command("import")
		.description("imports schema")
		.action(async () => {
			await cliActionWithoutContext("Import database", [importSchema]);
		});

	db.command("seed")
		.command("seed")
		.description("seeds a database")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-c, --connection <connection-name>",
			"configuration connection name as defined in configuration.ts",
			"development",
		)
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.option("-f, --file <seed-file-name>", "seed file", "seed.ts")
		.action(async (opts) => {
			await cliAction("monolayer seed", opts, [
				seed({
					replant: opts.replant,
					disableWarnings: opts.disableWarnings,
					seedFile: opts.file,
				}),
			]);
		});

	return db;
}
