import type { Command } from "@commander-js/extra-typings";
import { all, gen } from "effect/Effect";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ora from "ora";
import { databaseDestinationFolder } from "~db-data/programs/destination-folder.js";
import { DataCLIState } from "~db-data/state.js";
import { dataAction, dataActionWithEffect } from "../data.js";

export function seedScaffold(program: Command) {
	dataAction(program, "scaffold")
		.description("Scaffolds a seed file")
		.action(async (opts) => {
			await dataActionWithEffect(
				all([createDestinationFolder, createSeedFile]),
				opts,
			);
		});
}

const createDestinationFolder = gen(function* () {
	mkdirSync(yield* databaseDestinationFolder(""), {
		recursive: true,
	});
});

const createSeedFile = gen(function* () {
	const folder =
		(yield* DataCLIState.current).folder ??
		(yield* databaseDestinationFolder(""));
	const dataMigrationFilePath = path.join(folder, `seed.ts`);
	const spinner = ora();
	spinner.start(`Create seed file: ${dataMigrationFilePath}`);
	writeFileSync(dataMigrationFilePath, dataMigrationTemplate);
	spinner.succeed();
});

const dataMigrationTemplate = `import { Kysely } from "kysely";

export async function seed(db: Kysely<any>): Promise<void> {
}`;
