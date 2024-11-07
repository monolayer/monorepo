import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { databaseExists } from "@monorepo/programs/database/database-exists.js";
import { adminPgQuery } from "@monorepo/services/db-clients/admin-pg-query.js";
import { connectionOptions } from "@monorepo/services/db-clients/connection-options.js";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { catchAll, fail, gen, tap } from "effect/Effect";
import ora from "ora";

import { headlessCliAction } from "~db/cli-action.js";

export function createDb(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "create",
		program: program,
	})
		.description("creates a database")
		.action(async (opts) => {
			const spinner = ora();
			await headlessCliAction(opts, [
				Effect.provide(
					gen(function* () {
						spinner.start("Creating database");
						const databaseName = (yield* connectionOptions).databaseName;
						if (yield* databaseExists) {
							return databaseName;
						}
						yield* adminPgQuery(`CREATE DATABASE "${databaseName}";`);
						return databaseName;
					}).pipe(
						tap((databaseName) =>
							spinner.succeed(`Created database: ${databaseName}`),
						),
						catchAll((e) => {
							spinner.fail(`Failed to create database.`);
							return fail(e);
						}),
					),
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});
}
