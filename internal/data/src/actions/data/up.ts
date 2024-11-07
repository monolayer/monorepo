import type { Command } from "@commander-js/extra-typings";
import { gen, tryPromise } from "effect/Effect";
import type { MigrationInfo } from "kysely";
import { exit } from "node:process";
import color from "picocolors";
import prompts from "prompts";
import { dataMigrator } from "~data/migrator/data-migrator.js";
import { checkMigrationExists } from "~data/programs/migration-exists.js";
import { dataAction, dataActionWithEffect } from "../data.js";

export function dataUp(program: Command) {
	dataAction(program, "up")
		.description("Apply a single data migrations")
		.option(
			"-n, --name <data-migration-name>",
			"name of the migration to apply",
		)
		.action(async (opts) => {
			await dataActionWithEffect(
				opts.name ? applySingleWithName(opts.name) : applySingleWithPrompt,
				opts,
			);
		});
}

const applySingleWithPrompt = gen(function* () {
	const migrator = yield* dataMigrator;
	const notExecuted = (yield* tryPromise(() => migrator.status())).filter(
		(r) => r.executedAt === undefined,
	);
	if (notExecuted.length === 0) {
		console.log(
			`${color.yellow("skipped")} there are no data migrations to apply.`,
		);
	}

	const promptResult = yield* promptDataMigrationNames(notExecuted);
	if (promptResult.aborted) {
		exit(1);
	} else {
		yield* tryPromise(() => migrator.up(promptResult.dataMigrationName));
	}
});
const applySingleWithName = (name: string) =>
	gen(function* () {
		const migrator = yield* dataMigrator;
		const notExecuted = (yield* tryPromise(() => migrator.status())).filter(
			(r) => r.executedAt === undefined,
		);
		if (yield* checkMigrationExists(name)) {
			const isPending = notExecuted.find((m) => m.name === name);
			if (isPending) {
				yield* tryPromise(() => migrator.up(name));
			} else {
				console.log(
					`${color.yellow("skipped")} data migration ${name} already applied.`,
				);
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
			message: "Data migration to apply",
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
