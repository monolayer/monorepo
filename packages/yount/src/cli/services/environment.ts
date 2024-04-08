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

type EnvironmentProperties = {
	readonly name: string;
	readonly folder: string;
	readonly migrationFolder: string;
	readonly camelCaseOptions?: CamelCaseOptions;
	readonly connectionConfig: EnvironmentConfig;
};

export class Environment extends Context.Tag("Environment")<
	Environment,
	EnvironmentProperties
>() {}

export class DevEnvironment extends Context.Tag("DevEnvironment")<
	DevEnvironment,
	EnvironmentProperties
>() {}

export function environmentLayer(environment: string) {
	return Layer.effect(Environment, environmentGenerator(environment));
}

export function devEnvironmentLayer() {
	return Layer.effect(DevEnvironment, environmentGenerator("development"));
}

function environmentGenerator(environment: string) {
	return Effect.gen(function* (_) {
		const config = yield* _(Effect.promise(async () => await importConfig()));
		const connections = yield* _(
			Effect.promise(async () => await importConnections()),
		);
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
	});
}
