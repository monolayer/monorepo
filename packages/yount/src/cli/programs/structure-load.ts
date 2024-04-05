import { Effect } from "effect";
import fs from "fs/promises";
import path from "path";
import { Environment } from "../services/environment.js";
import { checkWithFail } from "../utils/check-with-fail.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { createDatabase } from "./create-database.js";
import { dropDatabase } from "./drop-database.js";
import { pgQuery } from "./pg-query.js";

export function structureLoad() {
	return Effect.succeed(true).pipe(
		Effect.tap(() => checkStructureFile()),
		Effect.tap(() => dropDatabase(true)),
		Effect.tap(() => createDatabase()),
		Effect.tap(() => restoreDatabaseFromStructureFile()),
	);
}

function checkStructureFile() {
	return Effect.all([Environment]).pipe(
		Effect.flatMap(([environment]) =>
			checkWithFail({
				name: `Check structure.sql file`,
				nextSteps: `Follow these steps to generate a structure file:

1) Create the development database: \`npx yount db:create -e development\`.

2) Generate migrations: \`npx yount generate -e development\`

3) Apply migrations: \`npx yount migrate -e development\``,
				errorMessage: `Structure file not found. Expected location: ${path.join(
					environment.config.folder,
					`structure.sql`,
				)}`,
				failMessage: "Structure file does not exist",
				callback: () =>
					Effect.tryPromise(async () => {
						const structurePath = path.join(
							environment.config.folder,
							`structure.sql`,
						);
						try {
							await fs.stat(structurePath);
						} catch (error) {
							return false;
						}
						return true;
					}),
			}),
		),
	);
}

function restoreDatabaseFromStructureFile() {
	return Effect.all([Environment]).pipe(
		Effect.flatMap(([environment]) =>
			spinnerTask(
				`Restore ${environment.pg.config.database} from structure.sql`,
				() =>
					Effect.tryPromise(async () => {
						const structurePath = path.join(
							environment.config.folder,
							`structure.sql`,
						);
						return (await fs.readFile(structurePath)).toString();
					}).pipe(
						Effect.flatMap((structure) =>
							pgQuery<{
								datname: string;
							}>(environment.pg.pool, structure),
						),
					),
			),
		),
	);
}
