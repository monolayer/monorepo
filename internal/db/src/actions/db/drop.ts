import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { dropDatabase } from "@monorepo/programs/database/drop-database.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { catchAll, fail, gen, tryPromise } from "effect/Effect";
import { exit } from "node:process";
import ora from "ora";
import color from "picocolors";
import prompts from "prompts";
import { headlessCliAction } from "~db/cli-action.js";

export function dropDb(program: Command) {
	commandWithDefaultOptions({
		name: "drop",
		program: program,
	})
		.description("drops a database")
		.action(async (opts) => {
			const spinner = ora();
			await headlessCliAction(opts, [
				gen(function* () {
					const dbName = yield* databaseName;
					yield* dropWarning(dbName);
					spinner.start("Droppping database");
					yield* dropDatabase;
					spinner.succeed(`Dropped database: ${dbName}`);
				}).pipe(
					catchAll((e) => {
						spinner.fail(`Failed to drop database.`);
						return fail(e);
					}),
				),
			]);
		});
}

const databaseName = gen(function* () {
	const clients = yield* DbClients;
	return clients.databaseName;
});

export const dropWarning = (databaseName: string) =>
	tryPromise(async () => {
		let aborted = false;
		console.log(
			`${color.yellow("Warning")} You are about to delete the database \`${databaseName}\`.`,
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
		if (aborted || response.value === false) {
			exit(1);
		}
	});
