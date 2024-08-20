import { ActionError } from "@monorepo/base/errors.js";
import { Effect } from "effect";
import type { Kysely } from "kysely";
import path from "path";
import { importConfig } from "~configuration/import-config.js";

type SeedImport = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed?: (db: Kysely<any>) => Promise<void>;
};

export function importSeed(seedFile: string) {
	return Effect.gen(function* () {
		const config = yield* importConfig;
		const seedFn = yield* Effect.tryPromise(async () => {
			const mod: SeedImport = await import(
				path.join(process.cwd(), config.folder, seedFile)
			);
			return mod.seed;
		});
		if (seedFn === undefined) {
			return yield* Effect.fail(
				new ActionError(
					"Missing seed function",
					`Could not find a seed function in ${seedFile}.`,
				),
			);
		} else {
			return seedFn;
		}
	});
}
