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
		if (envFile) {
			yield* loadMonoPGEnvironmentVariables(envFile);
		}
		const database = yield* databaseById(databaseId);
		const env: AppEnv = {
			folder: yield* monolayerFolder(),
			database,
		};
		return env;
	});
}

function loadMonoPGEnvironmentVariables(envFile: string) {
	return Effect.gen(function* () {
		const myObject: Record<string, string> = {};
		const env = dotenv.config({
			path: path.resolve(process.cwd(), envFile),
			processEnv: myObject,
		});
		for (const [key, value] of Object.entries(myObject)) {
			if (key.startsWith("MONO_PG_")) {
				process.env[key] = value;
			}
		}
		if (env.error) {
			yield* Effect.fail(
				new ActionError(
					`Error loading environment variables from ${envFile}`,
					`${env.error}`,
				),
			);
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
	return state.database.camelCase ?? { enabled: false };
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
		database: new MonoLayerPgDatabase("default", {
			schemas: [],
		}),
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
