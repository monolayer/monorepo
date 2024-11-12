import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { all, gen } from "effect/Effect";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ora from "ora";
import { dataActionWithEffect } from "~data/programs/data-action.js";
import { seedDestinationFolder } from "~data/programs/destination-folder.js";

export function seedScaffold(program: Command) {
	commandWithDefaultOptions({ name: "scaffold", program })
		.description("Scaffolds a seed file")
		.action(async (opts) => {
			await dataActionWithEffect(
				all([createDestinationFolder, createSeedFile]),
				{
					...opts,
					group: "",
				},
			);
		});
}

const createDestinationFolder = gen(function* () {
	mkdirSync(yield* seedDestinationFolder, {
		recursive: true,
	});
});

const createSeedFile = gen(function* () {
	const dataMigrationFilePath = path.join(
		yield* seedDestinationFolder,
		`seed.ts`,
	);
	const spinner = ora();
	spinner.start(`Create seed file: ${dataMigrationFilePath}`);
	writeFileSync(dataMigrationFilePath, dataMigrationTemplate);
	spinner.succeed();
});

const dataMigrationTemplate = `import { Kysely } from "kysely";

export async function seed(db: Kysely<any>): Promise<void> {
}`;
