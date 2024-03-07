import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { unlinkSync } from "fs";
import { Kysely } from "kysely";
import color from "picocolors";
import { exit } from "process";
import { Config } from "~/config.js";
import { fetchPendingMigrations } from "~/database/migrations/info.js";
import { ActionStatus, throwableOperation } from "../command.js";

export async function pendingMigrations(
	config: Config,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
) {
	const pending = await fetchPendingMigrations(config, kysely);

	if (pending.length > 0) {
		for (const migration of pending) {
			p.log.warn(`${color.yellow("pending")} (${migration.path})`);
		}
		const shouldContinue = await confirm({
			message: `You have pending migrations and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		});

		if (!shouldContinue) {
			p.cancel("Operation cancelled.");
			exit(1);
		}
		for (const migration of pending) {
			const result = await throwableOperation<typeof unlinkSync>(async () => {
				return unlinkSync(migration.path);
			});
			if (result.status === ActionStatus.Error) {
				p.cancel(`Unexpected error while deleting ${migration.path}`);
				console.error(result.error);
				exit(1);
			}
			p.log.info(`${color.green("removed")} (${migration.path})`);
		}
	}
}
