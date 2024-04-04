import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { Migrator } from "../services/migrator.js";

export function migrate() {
	return Effect.gen(function* (_) {
		const migrator = yield* _(Migrator);
		const { error, results } = yield* _(
			Effect.tryPromise(() => migrator.instance.migrateToLatest()),
		);
		if (results !== undefined) {
			if (results.length === 0) {
				p.log.info("No migrations to apply.");
				return false;
			}
			for (const result of results) {
				switch (result.status) {
					case "Success":
						if (error !== undefined) {
							p.log.info(
								`${color.green("Applied")} ${result.migrationName} (ROLLBACK)`,
							);
						} else {
							p.log.info(`${color.green("Applied")} ${result.migrationName}`);
						}
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
