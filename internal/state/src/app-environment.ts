import * as p from "@clack/prompts";
import { ActionError } from "@monorepo/cli/errors.js";
import { importConfig } from "@monorepo/configuration/import-config.js";
import { importDatabases } from "@monorepo/configuration/import-databases.js";
import type { MonolayerConfiguration } from "@monorepo/configuration/monolayer.js";
import { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import dotenv from "dotenv";
import { Context, Effect, Layer, Ref } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";

export interface AppEnv {
	entryPoints: MonolayerConfiguration["entryPoints"];
	database: MonoLayerPgDatabase;
}

export class AppEnvironment extends Context.Tag("AppEnvironment")<
	AppEnvironment,
	Ref.Ref<AppEnv>
>() {
	static provide<A, E, R>(program: Effect.Effect<A, E, R>, env: AppEnv) {
		return Effect.provide(program, Layer.effect(AppEnvironment, Ref.make(env)));
	}
}

export function getEnvironment(databaseId: string, envFile?: string) {
	return Effect.gen(function* () {
		yield* loadMonoPGEnvironmentVariablesFromEnvFile(
			envFile,
			envFile !== undefined,
		);
		const database = yield* databaseById(databaseId);
		const env: AppEnv = {
			entryPoints: yield* entryPoints(),
			database,
		};
		return env;
	});
}

function loadMonoPGEnvironmentVariablesFromEnvFile(
	envFile: string | undefined,
	fail: boolean,
) {
	return Effect.gen(function* () {
		const envObject: Record<string, string> = {};
		let configOutput: dotenv.DotenvConfigOutput = {};
		try {
			configOutput = dotenv.config({
				path: path.resolve(process.cwd(), envFile ?? ".env"),
				processEnv: envObject,
			});
			for (const [key, value] of Object.entries(envObject)) {
				if (key.startsWith("MONO_PG_")) {
					if (process.env[key] === undefined) {
						process.env[key] = value;
					}
				}
			}
		} catch {
			if (fail) {
				yield* Effect.fail(
					new ActionError(
						`Error loading environment variables from ${envFile}`,
						`${configOutput.error}`,
					),
				);
			}
		}
	});
}

export const appEnvironment = Effect.gen(function* () {
	const state = yield* AppEnvironment;
	return yield* Ref.get(state);
});

export const appEnvironmentConfigurationSchemas = Effect.gen(function* () {
	const state = yield* appEnvironment;
	return state.database.schemas;
});

export const appEnvironmentCamelCasePlugin = Effect.gen(function* () {
	const state = yield* appEnvironment;
	return state.database.camelCase;
});

export const appEnvironmentMigrationsFolder = Effect.gen(function* () {
	const appEnv = yield* appEnvironment;
	return path.join(cwd(), "monolayer", "migrations", appEnv.database.id);
});

export function entryPoints() {
	return Effect.gen(function* () {
		const config = yield* importConfig;
		return config.entryPoints;
	});
}

export const importSchemaEnvironment = Effect.gen(function* () {
	return {
		database: new MonoLayerPgDatabase({ id: "default", schemas: [] }),
		entryPoints: yield* entryPoints(),
	} satisfies AppEnv as AppEnv;
});

function allDatabases() {
	return Effect.gen(function* () {
		const databases = yield* importDatabases;
		if (databases === undefined) {
			p.log.error(color.red("Error"));
			return yield* Effect.fail(
				new ActionError(
					"Missing configurations",
					"No configurations found. Check your databases.ts file.",
				),
			);
		}
		return databases;
	});
}

export function databaseById(databaseId: string) {
	return Effect.gen(function* () {
		const databases = yield* allDatabases();
		const database = databases[databaseId];
		if (database === undefined) {
			p.log.error(color.red("Error"));
			return yield* Effect.fail(
				new ActionError(
					"Missing database",
					`No database found with id "${databaseId}". Check your databases.ts file.`,
				),
			);
		}
		return database;
	});
}
