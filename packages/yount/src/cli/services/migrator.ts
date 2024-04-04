import { Context, Effect, Layer } from "effect";
import { FileMigrationProvider, Migrator as KyselyMigrator } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { Environment } from "./environment.js";
import { Db } from "./kysely.js";

export class Migrator extends Context.Tag("Migrator")<
	Migrator,
	{
		readonly instance: KyselyMigrator;
	}
>() {}

export function migratorLayer() {
	return Layer.effect(
		Migrator,
		Effect.gen(function* (_) {
			const environment = yield* _(Environment);
			const db = yield* _(Db);
			return {
				instance: new KyselyMigrator({
					db: db.kysely,
					provider: new FileMigrationProvider({
						fs,
						path,
						migrationFolder: environment.config.migrationFolder,
					}),
				}),
			};
		}),
	);
}
