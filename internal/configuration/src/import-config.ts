import { ActionError } from "@monorepo/base/errors.js";
import { pipe } from "effect";
import { fail, flatMap, succeed, tryPromise } from "effect/Effect";
import path from "node:path";
import type { Monolayer } from "~configuration/monolayer.js";

type ConfigImport =
	| {
			default: Monolayer;
	  }
	| {
			default: {
				default: Monolayer;
			};
	  };

export const importConfig = pipe(
	tryPromise(() => import(path.join(process.cwd(), "monolayer.ts"))),
	flatMap((def) => {
		const config: Monolayer = isEsmImport(def)
			? def.default
			: def.default.default;

		if (config === undefined) {
			return fail(
				new ActionError(
					"Missing configuration",
					`Could not find the configuration in \`monolayer.ts\`.`,
				),
			);
		}
		return succeed(config);
	}),
);

function isEsmImport(
	imported: ConfigImport,
): imported is { default: Monolayer } {
	return !isCjsImport(imported);
}

function isCjsImport(
	imported: ConfigImport,
): imported is { default: { default: Monolayer } } {
	return (
		(imported as { default: { default: Monolayer } }).default.default !==
		undefined
	);
}
