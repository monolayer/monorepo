import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { Migrator } from "../services/migrator.js";

export function migrateDown() {
	return Effect.gen(function* (_) {
		const migrator = yield* _(Migrator);
		const { error, results } = yield* _(
			Effect.tryPromise(() => migrator.instance.migrateDown()),
		);
		if (results !== undefined) {
			for (const result of results) {
				switch (result.status) {
					case "Success":
						p.log.info(`${color.green("Down")} ${result.migrationName}`);
						break;
					case "Error":
						p.log.error(
							`${color.red("Error")} ${result.migrationName} (ROLLBACK)`,
						);
						break;
					case "NotExecuted":
						p.log.warn(
							`${color.yellow("Not executed")} ${result.migrationName}`,
						);
						break;
				}
			}
		}
		if (error !== undefined) {
			return yield* _(Effect.fail(error));
		}
		return true;
	});
}
