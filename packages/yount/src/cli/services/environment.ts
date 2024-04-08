import * as p from "@clack/prompts";
import { Context, Effect, Layer } from "effect";
import path from "path";
import pg from "pg";
import pgConnectionString from "pg-connection-string";
import color from "picocolors";
import { cwd } from "process";
import {
	importConfig,
	importConnections,
	type CamelCaseOptions,
} from "~/config.js";
import { type PoolAndConfig } from "~/pg/pg-pool.js";

export class Environment extends Context.Tag("Environment")<
	Environment,
	{
		readonly name: string;
		readonly folder: string;
		readonly migrationFolder: string;
		readonly camelCaseOptions?: CamelCaseOptions;
		pg: PoolAndConfig;
	}
>() {}

export class DevEnvironment extends Context.Tag("DevEnvironment")<
	DevEnvironment,
	{
		readonly name: string;
		readonly folder: string;
		readonly migrationFolder: string;
		readonly camelCaseOptions?: CamelCaseOptions;
		pg: PoolAndConfig;
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
				pg: yield* _(poolAndConfig(environmentConfig)),
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
				pg: yield* _(poolAndConfig(environmentConfig)),
			};
		}),
	);
}

function poolAndConfig(
	environmentConfig: pg.ClientConfig & pg.PoolConfig,
): Effect.Effect<
	{
		pool: pg.Pool;
		adminPool: pg.Pool;
		config:
			| (pg.ClientConfig & pg.PoolConfig)
			| pgConnectionString.ConnectionOptions;
	},
	string,
	never
> {
	const poolAndConfig = {
		pool: new pg.Pool(environmentConfig),
		adminPool: new pg.Pool({
			...environmentConfig,
			database: undefined,
		}),
		config:
			environmentConfig.connectionString !== undefined
				? pgConnectionString.parse(environmentConfig.connectionString)
				: environmentConfig,
	};
	return Effect.succeed(poolAndConfig);
}
