import { ActionError } from "@monorepo/cli/errors.js";
import { importFile } from "@monorepo/utils/import-file.js";
import { Effect } from "effect";
import { fail, flatMap, succeed } from "effect/Effect";
import path from "node:path";
import type { Monolayer } from "~configuration/monolayer.js";

export const importConfig = succeed(true).pipe(
	flatMap(() => importFile(path.join(process.cwd(), "monolayer.ts"))),
	flatMap((def) =>
		succeed(
			(def.default && def.default.default
				? def.default.default
				: def.default) as Monolayer | undefined,
		),
	),
	flatMap((config) =>
		Effect.if(config !== undefined, {
			onTrue: () => succeed(config!),
			onFalse: () =>
				fail(
					new ActionError(
						"Missing configuration",
						`Could not find the configuration in \`monolayer.ts\`.`,
					),
				),
		}),
	),
);
