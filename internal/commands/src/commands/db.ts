import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import { createDatabase } from "@monorepo/programs/database/create-database.js";
import { dropDatabase } from "@monorepo/programs/database/drop-database.js";
import { seed } from "@monorepo/programs/database/seed.js";
import { structureLoad } from "@monorepo/programs/database/structure-load.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import {
	PackageNameState,
	makePackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { importSchema } from "~commands/actions/import-schema.js";
import { cliAction, cliActionWithoutContext } from "~commands/cli-action.js";

export function dbCommands(program: Command, packageName: string) {
	const db = program.command("db");

	db.description("Database commands");

	commandWithDefaultOptions({
		name: "create",
		program: db,
	})
		.description("creates a database")
		.action(
			async (opts) =>
				await cliAction("Create Database", opts, [
					Effect.provide(
						createDatabase,
						Layer.effect(PackageNameState, makePackageNameState(packageName)),
					),
				]),
		);

	commandWithDefaultOptions({
		name: "drop",
		program: db,
	})
		.description("drops a database")
		.action(
			async (opts) =>
				await cliAction("Drop Database", opts, [
					Effect.provide(
						dropDatabase,
						Layer.effect(PackageNameState, makePackageNameState(packageName)),
					),
				]),
		);

	commandWithDefaultOptions({
		name: "reset",
		program: db,
	})
		.description("Restores a database from its structure file")
		.action(async (opts) => {
			await cliAction("Reset Database", opts, [
				Effect.provide(
					structureLoad(),
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});

	db.command("import")
		.description("imports schema")
		.action(async () => {
			await cliActionWithoutContext("Import database", [
				Effect.provide(
					importSchema,
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});

	commandWithDefaultOptions({
		name: "seed",
		program: db,
	})
		.description("seeds a database")
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-n, --disable-warnings", "disable truncation warnings")
		.action(async (opts) => {
			await cliAction("monolayer seed", opts, [
				ChangesetGeneratorState.provide(
					TableRenameState.provide(
						Effect.provide(
							seed({
								replant: opts.replant,
								disableWarnings: opts.disableWarnings,
							}),
							Layer.effect(PackageNameState, makePackageNameState(packageName)),
						),
					),
				),
			]);
		});

	return db;
}
