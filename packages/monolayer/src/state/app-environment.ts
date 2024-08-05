import * as p from "@clack/prompts";
import { Context, Effect, Ref } from "effect";
import path from "path";
import pgConnectionString from "pg-connection-string";
import color from "picocolors";
import { cwd } from "process";
import { ActionError } from "~/cli/errors.js";
import { importConfig, importConfigurations } from "~/import-config.js";
import { MonolayerPgConfiguration } from "../pg.js";

export interface AppEnv {
	name: string;
	configurationName: string;
	folder: string;
	configuration: MonolayerPgConfiguration;
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

export const currentConfig = Effect.gen(function* () {
	const env = yield* appEnvironment;
	return yield* configurationByName(env.configurationName);
});

export const appEnvironmentPgConfig = Effect.gen(function* () {
	const env = yield* appEnvironment;
	const configuration = yield* configurationByName(env.configurationName);
	const environmentConfiguration = configuration.connection(env.name);
	if (environmentConfiguration === undefined) {
		return yield* Effect.fail(
			new ActionError(
				"Missing connection configuration",
				`Connection '${env.name}' not found. Check your configuration.ts file.`,
			),
		);
	}
	return environmentConfiguration;
});

export const currentDatabaseName = Effect.gen(function* () {
	const pgConfig = yield* appEnvironmentPgConfig;
	const parsedConfig =
		pgConfig.connectionString !== undefined
			? pgConnectionString.parse(pgConfig.connectionString)
			: pgConfig;

	if (parsedConfig.database === undefined || parsedConfig.database === null) {
		return yield* Effect.fail(
			new ActionError(
				"Missing database",
				"No database found in connection configuration.",
			),
		);
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
		name: "import",
		configurationName: "default",
		configuration: new MonolayerPgConfiguration({
			schemas: [],
			connections: {
				development: {},
			},
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
