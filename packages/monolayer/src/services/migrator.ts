import { Context, Effect, Layer } from "effect";
import { FileMigrationProvider, Migrator as KyselyMigrator } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { DbClients } from "./db-clients.js";
import { Environment } from "./environment.js";

export type MigratorAttributes = {
	readonly instance: KyselyMigrator;
	readonly folder: string;
};

export class Migrator extends Context.Tag("Migrator")<
	Migrator,
	MigratorAttributes
>() {}

export function migratorLayer() {
	return Layer.effect(
		Migrator,
		Effect.gen(function* () {
			const environment = yield* Environment;
			const dbClients = yield* DbClients;
			return {
				instance: new KyselyMigrator({
					db: dbClients.currentEnvironment.kysely,
					provider: new FileMigrationProvider({
						fs,
						path,
						migrationFolder: environment.schemaMigrationsFolder,
					}),
				}),
				folder: environment.schemaMigrationsFolder,
			};
		}),
	);
}
