import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { dropDatabase } from "@monorepo/programs/database/drop-database.js";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { catchAll, fail, gen, tap } from "effect/Effect";
import ora from "ora";
import { headlessCliAction } from "~db/cli-action.js";

export function dropDb(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "drop",
		program: program,
	})
		.description("drops a database")
		.action(async (opts) => {
			const spinner = ora();
			await headlessCliAction(opts, [
				Effect.provide(
					gen(function* () {
						spinner.start("Droppping database");
						return yield* dropDatabase;
					}).pipe(
						tap((databaseName) =>
							spinner.succeed(`Dropped database: ${databaseName}`),
						),
						catchAll((e) => {
							spinner.fail(`Failed to drop database.`);
							return fail(e);
						}),
					),
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});
}
