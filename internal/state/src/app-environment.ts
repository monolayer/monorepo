import * as p from "@clack/prompts";
import { ActionError } from "@monorepo/cli/errors.js";
import {
	MonolayerConfig,
	MonolayerConfiguration,
} from "@monorepo/configuration/monolayer.js";
import { PgDatabase } from "@monorepo/pg/database.js";
import { importDefault } from "@monorepo/utils/import-default.js";
import { importFile } from "@monorepo/utils/import-file.js";
import dotenv from "dotenv";
import { Context, Effect, Layer, Ref } from "effect";
import { fail, gen } from "effect/Effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";

export interface AppEnv {
	databases: MonolayerConfiguration["databases"];
	currentDatabase: PgDatabase;
	currentWorkingDir?: string;
	debug?: boolean;
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
			databases: yield* databasesFilePath(),
			currentDatabase: database,
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
	return state.currentDatabase.schemas;
});

export const appEnvironmentCamelCasePlugin = Effect.gen(function* () {
	const state = yield* appEnvironment;
	return state.currentDatabase.camelCase;
});

export const appEnvironmentDebug = Effect.gen(function* () {
	const state = yield* appEnvironment;
	return state.debug ?? false;
});

export const appEnvironmentMigrationsFolder = Effect.gen(function* () {
	const appEnv = yield* appEnvironment;
	return path.join(cwd(), "monolayer", "migrations", appEnv.currentDatabase.id);
});

export function databasesFilePath() {
	return Effect.gen(function* () {
		const config = yield* importConfig;
		return config.databases;
	});
}

export const importSchemaEnvironment = Effect.gen(function* () {
	return {
		currentDatabase: new PgDatabase({ id: "default", schemas: [] }),
		databases: yield* databasesFilePath(),
	} satisfies AppEnv as AppEnv;
});

export function databaseById(databaseId: string) {
	return Effect.gen(function* () {
		const databases = yield* allDatabases;
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

export const currentDatabaseId = gen(function* () {
	const appEnv = yield* appEnvironment;
	return appEnv.currentDatabase.id;
});

export const currentWorkingDir = gen(function* () {
	const appEnv = yield* appEnvironment;
	return appEnv.currentWorkingDir ?? cwd();
});

const allDatabases = gen(function* () {
	const config = yield* importConfig;
	const databases = yield* importFile<Record<string, PgDatabase>>(
		path.join(process.cwd(), config.databases),
	);
	return databases !== undefined ? databases : yield* missingDatabases;
});

const missingDatabases = fail(
	new ActionError(
		"Missing configurations",
		"No configurations found. Check your databases.ts file.",
	),
);

const importConfig = gen(function* () {
	const configPath = path.join(process.cwd(), "monolayer.config.ts");
	const imported = yield* importDefault(configPath);
	return isMonolayerConfig(imported) ? imported : yield* missingConfiguration;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMonolayerConfig(def: any): def is MonolayerConfig {
	return (
		def !== undefined && def.constructor instanceof MonolayerConfig.constructor
	);
}

const missingConfiguration = fail(
	new ActionError(
		"Missing configuration",
		`Could not find the configuration in \`monolayer.config.ts\`.`,
	),
);
