import * as p from "@clack/prompts";
import { Context, Effect, Layer } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import {
	importConfig,
	importConnections,
	type CamelCaseOptions,
	type EnvironmentConfig,
} from "~/config.js";

export class Environment extends Context.Tag("Environment")<
	Environment,
	{
		readonly name: string;
		readonly folder: string;
		readonly migrationFolder: string;
		readonly camelCaseOptions?: CamelCaseOptions;
		readonly connectionConfig: EnvironmentConfig;
	}
>() {}

export class DevEnvironment extends Context.Tag("DevEnvironment")<
	DevEnvironment,
	{
		readonly name: string;
		readonly folder: string;
		readonly migrationFolder: string;
		readonly camelCaseOptions?: CamelCaseOptions;
		readonly connectionConfig: EnvironmentConfig;
	}
>() {}

function readConfig() {
	return Effect.promise(async () => await importConfig());
}

export function readConnections() {
	return Effect.promise(async () => await importConnections());
}

export function environmentLayer(environment: string) {
	return Layer.effect(
		Environment,
		Effect.gen(function* (_) {
			const config = yield* _(readConfig());
			const connections = yield* _(readConnections());
			const environmentConfig =
				connections.connections?.default.environments[environment];

			if (environmentConfig === undefined) {
				p.log.error(color.red("Error"));
				return yield* _(
					Effect.fail(
						`No connection configuration found for environment: '${environment}'. Check your connections.ts file.`,
					),
				);
			}
			return {
				name: environment,
				folder: config.folder,
				migrationFolder: path.join(cwd(), config.folder, "migrations"),
				camelCasePlugin: connections.connections?.default.camelCasePlugin,
				connectionConfig: environmentConfig,
			};
		}),
	);
}

export function devEnvironmentLayer() {
	return Layer.effect(
		DevEnvironment,
		Effect.gen(function* (_) {
			const config = yield* _(readConfig());
			const connections = yield* _(readConnections());

			const environmentConfig =
				connections.connections?.default.environments["development"];
			if (environmentConfig === undefined) {
				p.log.error(color.red("Error"));
				return yield* _(
					Effect.fail(
						`No connection configuration found for environment: 'development'. Check your connections.ts file.`,
					),
				);
			}
			return {
				name: "development",
				folder: config.folder,
				migrationFolder: path.join(cwd(), config.folder, "migrations"),
				camelCasePlugin: connections.connections?.default.camelCasePlugin,
				connectionConfig: environmentConfig,
			};
		}),
	);
}
