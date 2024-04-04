import { Effect } from "effect";
import { appendFileSync } from "fs";
import path from "path";
import { Environment } from "../services/environment.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { appendMigrationData } from "./append-migration-data.js";
import { databaseInConfig } from "./database-config.js";
import { databaseSearchPath } from "./database-search-path.js";
import { dumpStructure } from "./dump-structure.js";
import { setPgDumpEnv } from "./set-pg-dump-env.js";

export function dumpDatabaseStructureTask() {
	return spinnerTask("Dump database structure", () =>
		Effect.gen(function* (_) {
			const environment = yield* _(Environment);
			const searchPath = yield* _(databaseSearchPath(environment.pg.pool));
			const database = yield* _(databaseInConfig(environment.pg.config));
			const dumpPath = path.join(environment.config.folder, `${database}.sql`);
			yield* _(setPgDumpEnv(environment.pg.config));
			yield* _(dumpStructure(database, dumpPath));
			appendFileSync(`${dumpPath}`, `SET search_path TO ${searchPath};\n\n`);
			yield* _(appendMigrationData(database, dumpPath));
			return yield* _(Effect.succeed(true));
		}),
	);
}
