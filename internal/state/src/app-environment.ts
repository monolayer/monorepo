import * as p from "@clack/prompts";
import { ActionError } from "@monorepo/base/errors.js";
import { MonolayerPgConfiguration } from "@monorepo/configuration/configuration.js";
import dotenv from "dotenv";
import { Context, Effect, Ref } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { importConfig, importConfigurations } from "./import-config.js";

export interface AppEnv {
	configurationName: string;
	folder: string;
	configuration: MonolayerPgConfiguration;
	databaseUrl?: string;
}

export class AppEnvironment extends Context.Tag("EnvironmentState")<
	AppEnvironment,
	Ref.Ref<AppEnv>
>() {}

export function getEnvironment(configurationName: string, envFile?: string) {
	return Effect.gen(function* () {
		if (envFile) {
			yield* loadMonoPGEnvironmentVariables(envFile);
		}
		const env: AppEnv = {
			configurationName,
			folder: yield* monolayerFolder(),
			configuration: yield* configurationByName(configurationName),
			databaseUrl:
				process.env[
					`MONO_PG_${configurationName.toUpperCase()}_DATABASE_URL`
				] ?? "",
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

export const currentConfig = Effect.gen(function* () {
	const env = yield* appEnvironment;
	return yield* configurationByName(env.configurationName);
});

export const databaseUrl = Effect.gen(function* () {
	const env = yield* appEnvironment;
	const envVar = yield* databaseURLEnvVar;
	if (env.databaseUrl === undefined) {
		return yield* Effect.fail(
			new ActionError("Missing database URL", `undefined ${envVar}.`),
		);
	}
	return env.databaseUrl;
});

export const appEnvironmentConfigurationSchemas = Effect.gen(function* () {
	const state = yield* appEnvironment;
	return state.configuration.schemas;
});

export const appEnvironmentCamelCasePlugin = Effect.gen(function* () {
	const state = yield* appEnvironment;
	return state.configuration.camelCasePlugin ?? { enabled: false };
});

export const appEnvironmentMigrationsFolder = Effect.gen(function* () {
	const state = yield* appEnvironment;
	return path.join(cwd(), "monolayer", "migrations", state.configurationName!);
});

export function monolayerFolder() {
	return Effect.gen(function* () {
		const config = yield* Effect.tryPromise(importConfig);
		return config.folder;
	});
}

export const importSchemaEnvironment = Effect.gen(function* () {
	return {
		configurationName: "default",
		configuration: new MonolayerPgConfiguration({
			schemas: [],
		}),
		folder: yield* monolayerFolder(),
	} satisfies AppEnv as AppEnv;
});

function allConfigurations() {
	return Effect.gen(function* () {
		const configurations = yield* Effect.tryPromise(() =>
			importConfigurations(),
		);
		if (configurations === undefined) {
			p.log.error(color.red("Error"));
			return yield* Effect.fail(
				new ActionError(
					"Missing configurations",
					"No configurations found. Check your configuration.ts file.",
				),
			);
		}
		return configurations;
	});
}

export function configurationByName(configurationName: string) {
	return Effect.gen(function* () {
		const configurations = yield* allConfigurations();
		const configuration = configurations[configurationName];
		if (configuration === undefined) {
			p.log.error(color.red("Error"));
			return yield* Effect.fail(
				new ActionError(
					"Missing configuration",
					`No configuration found for ${configurationName}. Check your configuration.ts file.`,
				),
			);
		}
		return configuration;
	});
}

export const databaseURLEnvVar = Effect.gen(function* () {
	const env = yield* appEnvironment;
	const upperCaseEnvironmentName = env.configurationName.toUpperCase();
	return `MONO_PG_${upperCaseEnvironmentName}_DATABASE_URL` as const;
});
