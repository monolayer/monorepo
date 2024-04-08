import { Context, Effect, Layer } from "effect";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { readConnections } from "./environment.js";
import { Pg } from "./pg.js";

export class Db extends Context.Tag("Db")<
	Db,
	{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		readonly kysely: Kysely<any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		readonly kyselyNoCamelCase: Kysely<any>;
	}
>() {}

export function kyselyLayer() {
	return Layer.effect(
		Db,
		Effect.gen(function* (_) {
			const pg = yield* _(Pg);
			const connections = yield* _(readConnections());

			const useCamelCase =
				connections.connections?.default.camelCasePlugin?.enabled ?? false;
			return {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pg.pool,
					}),
					plugins: useCamelCase ? [new CamelCasePlugin()] : [],
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kyselyNoCamelCase: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pg.pool,
					}),
				}),
			};
		}),
	);
}
