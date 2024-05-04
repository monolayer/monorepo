import * as p from "@clack/prompts";
import { Context, Effect, Layer } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { importConfig, importConfigurations } from "~/config.js";
import {
	type CamelCaseOptions,
	type Configuration,
	type PgConfig,
} from "~/configuration.js";

export type EnvironmentProperties = {
	readonly name: string;
	readonly folder: string;
	readonly schemaMigrationsFolder: string;
	readonly camelCasePlugin?: CamelCaseOptions;
	readonly configurationName: string;
	readonly configurationConfig: PgConfig;
	readonly configuration: Configuration;
};

export class Environment extends Context.Tag("Environment")<
	Environment,
	EnvironmentProperties
>() {}

export class DevEnvironment extends Context.Tag("DevEnvironment")<
	DevEnvironment,
	EnvironmentProperties
>() {}

export function environmentLayer(
	environment: string,
	configurationName: string,
) {
	return Layer.effect(
		Environment,
		environmentGenerator(environment, configurationName),
	);
}

export function devEnvironmentLayer(configurationName: string) {
	return Layer.effect(
		DevEnvironment,
		environmentGenerator("development", configurationName),
	);
}

function environmentGenerator(environment: string, configurationName: string) {
	return Effect.gen(function* () {
		const monolayer = yield* Effect.promise(async () => await importConfig());
		const configurations = yield* Effect.promise(
			async () => await importConfigurations(),
		);
		const environmentConfigForConnection = configurations;

		if (environmentConfigForConnection === undefined) {
			p.log.error(color.red("Error"));
			return yield* Effect.fail(
				`No configurations found. Check your configuration.ts file.`,
			);
		}

		const configuration = environmentConfigForConnection[configurationName];

		if (configuration === undefined) {
			p.log.error(color.red("Error"));
			return yield* Effect.fail(
				`Configuration ${configurationName} not found. Check your configuration.ts file.`,
			);
		}
		const environmentConfig = configuration.environments[environment];
		if (environmentConfig === undefined) {
			p.log.error(color.red("Error"));
			return yield* Effect.fail(
				`Environment: '${environment}' missing in connector ${configurationName}. Check your configuration.ts file.`,
			);
		}
		return {
			name: environment,
			configurationName: configurationName,
			folder: monolayer.folder,
			schemaMigrationsFolder: path.join(
				cwd(),
				monolayer.folder,
				"migrations",
				configurationName,
			),
			camelCasePlugin: configuration.camelCasePlugin,
			configurationConfig: environmentConfig,
			configuration: configuration,
		};
	});
}

export function schemaMigrationsFolder() {
	return Effect.gen(function* () {
		const environment = yield* Environment;
		return environment.schemaMigrationsFolder;
	});
}

export function camelCaseOptions() {
	return DevEnvironment.pipe(
		Effect.flatMap((devEnvironment) =>
			Effect.succeed(devEnvironment.camelCasePlugin),
		),
	);
}

export function configurationSchemas() {
	return Effect.gen(function* () {
		const environment = yield* DevEnvironment;
		return environment.configuration.schemas;
	});
}
