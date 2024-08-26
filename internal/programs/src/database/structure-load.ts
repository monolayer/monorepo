import { checkWithFail } from "@monorepo/cli/check.js";
import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { pgQuery } from "@monorepo/services/db-clients/pg-query.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import fs from "fs/promises";
import { cwd } from "node:process";
import path from "path";
import { createDatabase } from "~programs/database/create-database.js";
import { dropDatabase } from "~programs/database/drop-database.js";

export function structureLoad() {
	return checkStructureFile().pipe(
		Effect.tap(dropDatabase),
		Effect.tap(createDatabase),
		Effect.tap(restoreDatabaseFromStructureFile),
	);
}

function checkStructureFile() {
	return appEnvironment.pipe(
		Effect.flatMap((environment) =>
			checkWithFail({
				name: `Check structure.${environment.currentDatabase.id}.sql`,
				nextSteps: `Follow these steps to generate a structure file:

1) Create the development database: \`npx monolayer db:create -e development\`.

2) Generate migrations: \`npx monolayer generate -e development\`

3) Apply migrations: \`npx monolayer migrate -e development\``,
				errorMessage: `Structure file not found. Expected location: ${path.join(
					cwd(),
					"monolayer",
					"dumps",
					`structure.${environment.currentDatabase.id}.sql`,
				)}`,
				failMessage: "Structure file does not exist",
				callback: () =>
					Effect.tryPromise(async () => {
						const structurePath = path.join(
							cwd(),
							"monolayer",
							"dumps",
							`structure.${environment.currentDatabase.id}.sql`,
						);
						try {
							await fs.stat(structurePath);
						} catch {
							return false;
						}
						return true;
					}),
			}),
		),
	);
}

function restoreDatabaseFromStructureFile() {
	return Effect.all([appEnvironment, DbClients]).pipe(
		Effect.flatMap(([environment, dbClients]) =>
			spinnerTask(
				`Restore ${dbClients.databaseName} from structure.${environment.currentDatabase.id}.sql`,
				() =>
					Effect.tryPromise(async () => {
						const structurePath = path.join(
							cwd(),
							"monolayer",
							"dumps",
							`structure.${environment.currentDatabase.id}.sql`,
						);
						return (await fs.readFile(structurePath)).toString();
					}).pipe(
						Effect.flatMap((structure) =>
							pgQuery<{
								datname: string;
							}>(structure),
						),
					),
			),
		),
	);
}
