import { Effect } from "effect";
import { Migrator } from "../services/migrator.js";

export function allMigrations() {
	return Effect.gen(function* (_) {
		const migrator = yield* _(Migrator);
		const allMigrations = yield* _(
			Effect.promise(async () => {
				return await migrator.instance.getMigrations();
			}),
		);
		return allMigrations;
	});
}
