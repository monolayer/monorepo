import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import type { InformationSchemaDB } from "@monorepo/pg/introspection/introspection/types.js";
import { dbTableInfo } from "@monorepo/pg/introspection/table.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { importFile } from "@monorepo/utils/import-file.js";
import { Effect } from "effect";
import { gen, tryPromise } from "effect/Effect";
import { sql, type Kysely } from "kysely";
import path from "node:path";
import { cwd, exit } from "node:process";
import ora from "ora";
import color from "picocolors";
import prompts from "prompts";
import { databaseDestinationFolder } from "~data/programs/destination-folder.js";
import { dataActionWithEffect } from "../data.js";

export function seedUp(program: Command) {
	commandWithDefaultOptions({
		name: "up",
		program,
	})
		.description("seed database")
		.option("-f, --file <seed-file>", "Ppath to seed file")
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-n, --disable-warnings", "disable truncation warnings")
		.action(async (opts) => {
			await dataActionWithEffect(
				gen(function* () {
					if (opts.replant && !opts.disableWarnings) {
						const response = yield* replantWarning;
						if (response.aborted) {
							exit(1);
						}
						if (response.value) {
							yield* truncateAllTables;
						}
					}
					const filePath = opts.file
						? path.isAbsolute(opts.file)
							? opts.file
							: path.join(cwd(), opts.file)
						: path.join(yield* databaseDestinationFolder(""), "seed.ts");

					const seedImport = yield* importFile<SeedFile>(filePath);

					if (seedImport.seed === undefined) {
						console.error(`Missing seed function in ${filePath}`);
					} else {
						const dbClients = yield* DbClients;
						yield* tryPromise(() => seedImport.seed(dbClients.kysely));
						ora().succeed("Seed database");
					}
				}),
				opts,
			);
		});
}

interface SeedFile {
	seed: (db: Kysely<any>) => Promise<void>;
}

export const replantWarning = tryPromise(async () => {
	let aborted = false;
	console.log(
		`${color.yellow("warning")} All tables in the database will be truncated.`,
	);
	const response = await prompts({
		type: "confirm",
		name: "value",
		message: "Do you want to proceed?",
		initial: true,
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	return {
		aborted,
		value: response.value,
	};
});

export const truncateAllTables = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	const tableInfo = yield* Effect.tryPromise(() =>
		dbTableInfo(dbClients.kysely as Kysely<InformationSchemaDB>, "public"),
	);
	for (const table of tableInfo) {
		yield* Effect.tryPromise(() =>
			sql`truncate table ${sql.table(
				`${table.name}`,
			)} RESTART IDENTITY CASCADE`.execute(dbClients.kysely),
		);
	}
});
