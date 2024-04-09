import * as p from "@clack/prompts";
import { Context, Effect, Layer } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { importConfig, importConnections } from "~/config.js";
import {
	type CamelCaseOptions,
	type Connections,
	type PgConfig,
} from "~/configuration.js";

type EnvironmentProperties = {
	readonly name: string;
	readonly folder: string;
	readonly migrationFolder: string;
	readonly camelCasePlugin?: CamelCaseOptions;
	readonly connectionName: string;
	readonly connectionConfig: PgConfig;
};

export class Environment extends Context.Tag("Environment")<
	Environment,
	EnvironmentProperties
>() {}

export class DevEnvironment extends Context.Tag("DevEnvironment")<
	DevEnvironment,
	EnvironmentProperties
>() {}

export function environmentLayer(environment: string, connectionName: string) {
	return Layer.effect(
		Environment,
		environmentGenerator(environment, connectionName),
	);
}

export function devEnvironmentLayer(connectionName: string) {
	return Layer.effect(
		DevEnvironment,
		environmentGenerator("development", connectionName),
	);
}

function environmentGenerator(environment: string, connectionName: string) {
	return Effect.gen(function* (_) {
		const config = yield* _(Effect.promise(async () => await importConfig()));
		const connections = yield* _(
			Effect.promise(async () => await importConnections()),
		);

		const environmentConfigForConnection = connections.connections;

		if (environmentConfigForConnection === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`No connection configurations found. Check your connections.ts file.`,
				),
			);
		}

		const connection =
			environmentConfigForConnection[connectionName as keyof Connections];

		if (connection === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`Connection ${connectionName} not found. Check your connections.ts file.`,
				),
			);
		}

		connection.environments[environment];
		const environmentConfig = connection.environments[environment];

		if (environmentConfig === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`Environment: '${environment}' missing in connection ${connectionName}. Check your connections.ts file.`,
				),
			);
		}
		return {
			name: environment,
			connectionName: connectionName,
			folder: config.folder,
			migrationFolder: path.join(
				cwd(),
				config.folder,
				"migrations",
				connectionName,
			),
			camelCasePlugin: connections.connections?.default.camelCasePlugin,
			connectionConfig: environmentConfig,
		};
	});
}
