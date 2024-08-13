import * as p from "@clack/prompts";
import { ActionError } from "@monorepo/base/errors.js";
import { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import dotenv from "dotenv";
import { Context, Effect, Ref } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { importConfig, importDatabases } from "./import-config.js";

export interface AppEnv {
	folder: string;
	database: MonoLayerPgDatabase;
}

export class AppEnvironment extends Context.Tag("EnvironmentState")<
	AppEnvironment,
	Ref.Ref<AppEnv>
>() {}

export function getEnvironment(databaseId: string, envFile?: string) {
	return Effect.gen(function* () {
		yield* loadMonoPGEnvironmentVariablesFromEnvFile(
			envFile,
			envFile !== undefined,
		);
		const database = yield* databaseById(databaseId);
		const env: AppEnv = {
			folder: yield* monolayerFolder(),
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

export function monolayerFolder() {
	return Effect.gen(function* () {
		const config = yield* Effect.tryPromise(importConfig);
		return config.folder;
	});
}

export const importSchemaEnvironment = Effect.gen(function* () {
	return {
		database: new MonoLayerPgDatabase({ id: "default", schemas: [] }),
		folder: yield* monolayerFolder(),
	} satisfies AppEnv as AppEnv;
});

function allDatabases() {
	return Effect.gen(function* () {
		const databases = yield* Effect.tryPromise(() => importDatabases());
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
