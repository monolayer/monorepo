import { pgQuery } from "@monorepo/services/db-clients/pg-query.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { pathExists } from "@monorepo/utils/path.js";
import { gen, tryPromise } from "effect/Effect";
import fs from "fs/promises";
import { cwd, exit } from "node:process";
import ora from "ora";
import path from "path";
import { createDatabase } from "~programs/database/create-database.js";
import { dropDatabase } from "~programs/database/drop-database.js";

export const structureLoad = gen(function* () {
	yield* checkFile;
	yield* dropDatabase;
	yield* createDatabase;
	yield* restoreDatabaseFromStructureFile;
});

const checkFile = gen(function* () {
	const appEnv = yield* appEnvironment;

	const spinner = ora();
	spinner.start(`Check structure.${appEnv.currentDatabase.id}.sql`);

	const exists = yield* pathExists(
		path.join(
			cwd(),
			"monolayer",
			"dumps",
			`structure.${appEnv.currentDatabase.id}.sql`,
		),
	);
	if (!exists) {
		spinner.fail();
		exit(1);
	}
	spinner.succeed();
});

const restoreDatabaseFromStructureFile = gen(function* () {
	const appEnv = yield* appEnvironment;
	const spinner = ora();
	spinner.start(
		`Restore database from structure.${appEnv.currentDatabase.id}.sql`,
	);
	const data = yield* tryPromise(async () => {
		const structurePath = path.join(
			cwd(),
			"monolayer",
			"dumps",
			`structure.${appEnv.currentDatabase.id}.sql`,
		);
		return (await fs.readFile(structurePath)).toString();
	});
	yield* pgQuery<{
		datname: string;
	}>(data);
	spinner.succeed();
});
