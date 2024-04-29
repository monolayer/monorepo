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
	readonly schemaRevisionsFolder: string;
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
	return Effect.gen(function* (_) {
		const yountConfig = yield* _(
			Effect.promise(async () => await importConfig()),
		);
		const configurations = yield* _(
			Effect.promise(async () => await importConfigurations()),
		);
		const environmentConfigForConnection = configurations;

		if (environmentConfigForConnection === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`No configurations found. Check your configuration.ts file.`,
				),
			);
		}

		const configuration = environmentConfigForConnection[configurationName];

		if (configuration === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`Configuration ${configurationName} not found. Check your configuration.ts file.`,
				),
			);
		}
		const environmentConfig = configuration.environments[environment];
		if (environmentConfig === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`Environment: '${environment}' missing in connector ${configurationName}. Check your configuration.ts file.`,
				),
			);
		}
		return {
			name: environment,
			configurationName: configurationName,
			folder: yountConfig.folder,
			schemaRevisionsFolder: path.join(
				cwd(),
				yountConfig.folder,
				"revisions",
				configurationName,
			),
			camelCasePlugin: configuration.camelCasePlugin,
			configurationConfig: environmentConfig,
			configuration: configuration,
		};
	});
}

export function schemaRevisionsFolder() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		return environment.schemaRevisionsFolder;
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
	return Effect.gen(function* (_) {
		const environment = yield* _(DevEnvironment);
		return environment.configuration.schemas;
	});
}
