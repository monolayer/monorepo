import type { Command } from "@commander-js/extra-typings";
import { gen, tryPromise } from "effect/Effect";
import type { MigrationInfo } from "kysely";
import { exit } from "node:process";
import color from "picocolors";
import prompts from "prompts";
import { dataMigrator } from "~data/migrator/data-migrator.js";
import { checkMigrationExists } from "~data/programs/migration-exists.js";
import { dataAction, dataActionWithEffect } from "../data.js";

export function dataDown(program: Command) {
	dataAction(program, "down")
		.description("Revert a specific data migration.")
		.option(
			"-n, --name <data-migration-name>",
			"name of the migration to revert",
		)
		.action(async (opts) => {
			await dataActionWithEffect(
				gen(function* () {
					if (opts.name) {
						yield* revertWithName(opts.name);
					} else {
						yield* revertWithPrompt;
					}
				}),
				opts,
			);
		});
}

const revertWithPrompt = gen(function* () {
	const migrator = yield* dataMigrator;
	const notExecuted = (yield* tryPromise(() => migrator.status())).filter(
		(r) => r.executedAt !== undefined,
	);
	if (notExecuted.length === 0) {
		console.log(
			`${color.yellow("skipped")} there a no data migrations to revert.`,
		);
	}
	const promptResult = yield* promptDataMigrationNames(notExecuted);
	if (promptResult.aborted) {
		exit(1);
	}
	yield* tryPromise(() => migrator.down(promptResult.dataMigrationName));
});

const revertWithName = (name: string) =>
	gen(function* () {
		const migrator = yield* dataMigrator;
		if (yield* checkMigrationExists(name)) {
			const isPending = (yield* tryPromise(() => migrator.status())).find(
				(r) => r.executedAt === undefined && r.name === name,
			);
			if (isPending) {
				console.log(
					`${color.yellow("skipped")} data migration ${name} is pending.`,
				);
			} else {
				yield* tryPromise(() => migrator.down(name));
			}
		} else {
			console.error(`Migration ${name} does not exist.`);
			exit(1);
		}
	});

const promptDataMigrationNames = (migrationInfo: MigrationInfo[]) =>
	tryPromise(async () => {
		let aborted = false;
		const response = await prompts({
			type: "select",
			name: "dataMigrationName",
			message: "Data migration to revert",
			choices: migrationInfo.map((info) => {
				return { title: info.name, value: info.name };
			}),
			onState: (e) => {
				aborted = e.aborted;
			},
		});
		return {
			aborted,
			dataMigrationName: response.dataMigrationName,
		};
	});
