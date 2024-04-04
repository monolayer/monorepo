import * as p from "@clack/prompts";
import { Context, Effect, Layer } from "effect";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { importConfig, type Config } from "~/config.js";
import { type PoolAndConfig } from "~/pg/pg-pool.js";
import { poolAndConfig } from "../programs/pool-and-config.js";

type MigrationFolder = {
	migrationFolder: string;
};

export class Environment extends Context.Tag("Environment")<
	Environment,
	{
		readonly name: string;
		readonly config: Config & MigrationFolder;
		pg: PoolAndConfig;
	}
>() {}

export function environmentLayer(environment: string) {
	return Layer.effect(
		Environment,
		Effect.gen(function* (_) {
			const config = yield* _(Effect.promise(async () => await importConfig()));
			const environmentConfig = config.environments[environment];
			if (environmentConfig === undefined) {
				p.log.error(color.red("Error"));
				return yield* _(
					Effect.fail(
						`No configuration found for environment: '${environment}'. Please check your yount.config.ts file.`,
					),
				);
			}
			return {
				name: environment,
				config: {
					...config,
					migrationFolder: path.join(cwd(), config.folder, "migrations"),
				},
				pg: yield* _(poolAndConfig(environmentConfig)),
			};
		}),
	);
}
