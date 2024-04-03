import { Effect } from "effect";
import { appendFileSync } from "fs";
import path from "path";
import type { Config } from "~/config.js";
import type { PoolAndConfig } from "~/pg/pg-pool.js";
import { appendMigrationData } from "../programs/append-migration-data.js";
import { databaseInConfig } from "../programs/database-config.js";
import { databaseSearchPath } from "../programs/database-search-path.js";
import { dumpStructure } from "../programs/dump-structure.js";
import { setPgDumpEnv } from "../programs/set-pg-dump-env.js";
import { spinnerTask } from "../utils/spinner-task.js";

export function dumpDatabaseStructureTask(poolAndConfig: {
	pg: PoolAndConfig;
	config: Config;
}) {
	return spinnerTask("Dump database structure", () =>
		Effect.gen(function* (_) {
			const searchPath = yield* _(databaseSearchPath(poolAndConfig.pg.pool));
			const database = yield* _(databaseInConfig(poolAndConfig.pg.config));
			const dumpPath = path.join(
				poolAndConfig.config.folder,
				`${database}.sql`,
			);
			yield* _(setPgDumpEnv(poolAndConfig.pg.config));
			yield* _(dumpStructure(database, dumpPath));
			appendFileSync(`${dumpPath}`, `SET search_path TO ${searchPath};\n\n`);
			yield* _(appendMigrationData(database, dumpPath));
			return yield* _(Effect.succeed(true));
		}),
	);
}
