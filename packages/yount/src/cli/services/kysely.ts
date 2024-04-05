import { Context, Effect, Layer } from "effect";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Environment } from "./environment.js";

export class Db extends Context.Tag("Db")<
	Db,
	{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		readonly kysely: Kysely<any>;
	}
>() {}

export function kyselyLayer() {
	return Layer.effect(
		Db,
		Effect.gen(function* (_) {
			const environment = yield* _(Environment);
			const useCamelCase = environment.config.camelCasePlugin || false;
			return {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: environment.pg.pool,
					}),
					plugins: useCamelCase ? [new CamelCasePlugin()] : [],
				}),
			};
		}),
	);
}
