import * as p from "@clack/prompts";
import { Context, Effect, Ref } from "effect";
import path from "path";
import pgConnectionString from "pg-connection-string";
import color from "picocolors";
import { cwd } from "process";
import { importConfig, importConfigurations } from "~/config.js";
import type { Configuration } from "~/configuration.js";

export interface AppEnv {
	name: string;
	configurationName: string;
	folder: string;
	configuration: Configuration;
}

export class AppEnvironment extends Context.Tag("EnvironmentState")<
	AppEnvironment,
	Ref.Ref<AppEnv>
>() {}

export function getEnvironment(name: string, configurationName: string) {
	return Effect.gen(function* () {
		const env: AppEnv = {
			name,
			configurationName,
			folder: yield* monolayerFolder(),
			configuration: yield* configurationByName(configurationName),
		};
		return env;
	});
}

export const appEnvironment = Effect.gen(function* () {
	const state = yield* AppEnvironment;
	return yield* Ref.get(state);
});

export class MissingConnectionConfiguration extends Error {
	constructor(name: string) {
		super(`Connection '${name}' not found. Check your configuration.ts file.`);
	}
}

export const appEnvironmentPgConfig = Effect.gen(function* () {
	const env = yield* appEnvironment;
	const configuration = yield* configurationByName(env.configurationName);
	const environmentConfiguration = configuration.connections[env.name];
	if (environmentConfiguration === undefined) {
		return yield* Effect.fail(new MissingConnectionConfiguration(env.name));
	}
	return environmentConfiguration;
});

export class NoDatabaseFound extends Error {
	constructor() {
		super("No database found in connection configuration.");
	}
}

export const currentDatabaseName = Effect.gen(function* () {
	const pgConfig = yield* appEnvironmentPgConfig;
	const parsedConfig =
		pgConfig.connectionString !== undefined
			? pgConnectionString.parse(pgConfig.connectionString)
			: pgConfig;

	if (parsedConfig.database === undefined || parsedConfig.database === null) {
		return yield* Effect.fail(new NoDatabaseFound());
	}
	return parsedConfig.database;
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
	return path.join(
		cwd(),
		state.folder!,
		"migrations",
		state.configurationName!,
	);
});

export function monolayerFolder() {
	return Effect.gen(function* () {
		const config = yield* Effect.tryPromise(importConfig);
		return config.folder;
	});
}

export const importSchemaEnvironment = Effect.gen(function* () {
	return {
		name: "import",
		configurationName: "default",
		configuration: {
			schemas: [],
			connections: {
				development: {},
			},
		},
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
				`No configurations found. Check your configuration.ts file.`,
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
				`No configuration found for ${configurationName}. Check your configuration.ts file.`,
			);
		}
		return configuration;
	});
}
