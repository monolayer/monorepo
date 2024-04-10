import * as p from "@clack/prompts";
import { Context, Effect, Layer } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { importConfig, importConnector } from "~/config.js";
import {
	type CamelCaseOptions,
	type Connector,
	type Connectors,
	type PgConfig,
} from "~/configuration.js";

export type EnvironmentProperties = {
	readonly name: string;
	readonly folder: string;
	readonly migrationFolder: string;
	readonly camelCasePlugin?: CamelCaseOptions;
	readonly connectorName: string;
	readonly connectorConfig: PgConfig;
	readonly connector: Connector;
};

export class Environment extends Context.Tag("Environment")<
	Environment,
	EnvironmentProperties
>() {}

export class DevEnvironment extends Context.Tag("DevEnvironment")<
	DevEnvironment,
	EnvironmentProperties
>() {}

export function environmentLayer(environment: string, connectorName: string) {
	return Layer.effect(
		Environment,
		environmentGenerator(environment, connectorName),
	);
}

export function devEnvironmentLayer(connectorName: string) {
	return Layer.effect(
		DevEnvironment,
		environmentGenerator("development", connectorName),
	);
}

function environmentGenerator(environment: string, connectorName: string) {
	return Effect.gen(function* (_) {
		const config = yield* _(Effect.promise(async () => await importConfig()));
		const connectors = yield* _(
			Effect.promise(async () => await importConnector()),
		);
		const environmentConfigForConnection = connectors.connectors;

		if (environmentConfigForConnection === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`No connector configurations found. Check your connectors.ts file.`,
				),
			);
		}

		const connector =
			environmentConfigForConnection[connectorName as keyof Connectors];

		if (connector === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`Connection ${connectorName} not found. Check your connectors.ts file.`,
				),
			);
		}

		connector.environments[environment];
		const environmentConfig = connector.environments[environment];

		if (environmentConfig === undefined) {
			p.log.error(color.red("Error"));
			return yield* _(
				Effect.fail(
					`Environment: '${environment}' missing in connector ${connectorName}. Check your connectors.ts file.`,
				),
			);
		}
		return {
			name: environment,
			connectorName: connectorName,
			folder: config.folder,
			migrationFolder: path.join(
				cwd(),
				config.folder,
				"migrations",
				connectorName,
			),
			camelCasePlugin: connectors.connectors?.default.camelCasePlugin,
			connectorConfig: environmentConfig,
			connector: connector,
		};
	});
}
