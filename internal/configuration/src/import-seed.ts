import { ActionError } from "@monorepo/cli/errors.js";
import { importFile } from "@monorepo/utils/import-file.js";
import { Effect, pipe } from "effect";
import { fail, flatMap, succeed } from "effect/Effect";
import type { Kysely } from "kysely";
import path from "path";
import { importConfig } from "~configuration/import-config.js";
import type { MonolayerConfig } from "~configuration/monolayer.js";

type SeedImport = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed: (db: Kysely<any>) => Promise<void>;
};

export const importSeed = (seedFile?: string) =>
	pipe(
		importConfig,
		flatMap((config) =>
			importFile<Partial<SeedImport>>(
				resolveSeedFilePath(config, seedFile),
			).pipe(
				flatMap((seed) => succeed(seed.seed)),
				flatMap((seedFn) =>
					Effect.if(seedFn !== undefined, {
						onTrue: () => succeed(seedFn!),
						onFalse: () =>
							fail(
								new ActionError(
									"Missing seed function",
									`Could not find a seed function in ${resolveSeedFilePath(config, seedFile)}.`,
								),
							),
					}),
				),
			),
		),
	);

function resolveSeedFilePath(config: MonolayerConfig, seedFile?: string) {
	return seedFile
		? seedFile
		: path.join(process.cwd(), config.entryPoints.seed);
}
