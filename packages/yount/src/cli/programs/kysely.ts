import { Effect } from "effect";
import {
	FileMigrationProvider,
	Kysely,
	Migrator,
	PostgresDialect,
} from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { type Pool } from "pg";
import type { Config } from "~/config.js";
import type { PoolAndConfig } from "~/pg/pg-pool.js";
import { migrationFolder } from "./migration-folder.js";

export function kysely(pool: Pool) {
	return Effect.succeed(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		new Kysely<any>({
			dialect: new PostgresDialect({
				pool: pool,
			}),
		}),
	);
}
export function kyselyMigrator(poolAndConfig: {
	pg: PoolAndConfig;
	config: Config;
}) {
	return Effect.gen(function* (_) {
		const db = yield* _(kysely(poolAndConfig.pg.pool));
		const folder = yield* _(migrationFolder(poolAndConfig.config));
		return new Migrator({
			db,
			provider: new FileMigrationProvider({
				fs,
				path,
				migrationFolder: folder,
			}),
		});
	});
}
