import { Effect } from "effect";
import { importConfig } from "~/config.js";
import { pgPoolAndConfig } from "~/pg/pg-pool.js";
import { checkEnvironmentConfig } from "./check-environment-config.js";

export function environmentPool(environment: string) {
	return Effect.gen(function* (_) {
		const config = yield* _(Effect.promise(async () => await importConfig()));
		yield* _(checkEnvironmentConfig(config, environment));
		return yield* _(
			Effect.succeed({
				pg: pgPoolAndConfig(config, environment),
				config: config,
			}),
		);
	});
}
