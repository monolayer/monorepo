import { ActionError } from "@monorepo/cli/errors.js";
import { importFile } from "@monorepo/utils/import-file.js";
import { Effect } from "effect";
import { fail, flatMap, succeed } from "effect/Effect";
import path from "node:path";
import { MonolayerConfig } from "~configuration/monolayer.js";

export const importConfig = succeed(true).pipe(
	flatMap(() => importFile(path.join(process.cwd(), "monolayer.config.ts"))),
	flatMap((def) =>
		succeed(
			def.default && def.default.default ? def.default.default : def.default,
		),
	),
	flatMap((config) =>
		Effect.if(
			config !== undefined &&
				config.constructor instanceof MonolayerConfig.constructor,
			{
				onTrue: () => succeed(config! as MonolayerConfig),
				onFalse: () =>
					fail(
						new ActionError(
							"Missing configuration",
							`Could not find the configuration in \`monolayer.config.ts\`.`,
						),
					),
			},
		),
	),
);
