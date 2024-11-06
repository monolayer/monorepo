import type { Command } from "@commander-js/extra-typings";
import { logEmpty } from "@monorepo/cli/console.js";
import { gen, tryPromise } from "effect/Effect";
import type { MigrationResultSet } from "kysely";
import path from "node:path";
import { cwd } from "node:process";
import color from "picocolors";
import { dataMigrator } from "~db-data/migrator/data-migrator.js";
import { databaseDestinationFolder } from "~db-data/programs/destination-folder.js";
import { dataAction, dataActionWithEffect } from "../data.js";

export function dataApply(program: Command) {
	dataAction(program, "apply")
		.description("Apply pending data migrations")
		.action(async (opts) => {
			await dataActionWithEffect(
				gen(function* () {
					const migrator = yield* dataMigrator;
					const status = yield* tryPromise(() => migrator.migrateToLatest());
					if (status.error === undefined) {
						if (status.results?.length === 0) {
							console.log(
								`${color.yellow("skipped")} there are no data migrations to apply.`,
							);
						}
					} else {
						console.log("");
						yield* printStatus(status);
					}
				}),
				opts,
			);
		});
}

function printStatus(migrationResult: MigrationResultSet) {
	return gen(function* () {
		if (migrationResult.error) {
			console.log(
				`\n${color.bgRed(color.white("Error"))} Could not apply all data migrations. Executed migrations have been rolled back.\n`,
			);
		}
		const results = migrationResult.results;
		if (results !== undefined) {
			const folder = yield* databaseDestinationFolder("data");
			const maxLength = maximumLabelLength(migrationResult);
			for (const result of results) {
				const dataMigrationFilePath = path.relative(
					cwd(),
					path.join(folder, `${result.migrationName}.ts`),
				);
				switch (result.status) {
					case "Error":
						console.log(
							`${color.red("error".padStart(maxLength, " "))} ./${dataMigrationFilePath}`,
						);
						break;
					case "NotExecuted":
						console.log(
							`${color.yellow("not executed")} ./${dataMigrationFilePath}`,
						);
						break;
					case "Success":
						console.log(
							`${color.green("success".padStart(maxLength, " "))} ./${dataMigrationFilePath}${migrationResult.error !== undefined ? color.gray("  (ROLLBACK)") : ""}`,
						);
						break;
				}
			}
		}
		if (migrationResult.error) {
			logEmpty();
			console.dir(migrationResult.error, { depth: null });
		}
	});
}

export function maximumLabelLength(migrationResult: MigrationResultSet) {
	return migrationResult.results?.some((r) => r.status === "NotExecuted")
		? "not executed".length
		: migrationResult.results?.some((r) => r.status === "Success")
			? "success".length
			: "error".length;
}
