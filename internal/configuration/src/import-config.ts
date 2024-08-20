import path from "node:path";
import type { Monolayer } from "~configuration/configuration.js";

type ConfigImport =
	| {
			default: Monolayer;
	  }
	| {
			default: {
				default: Monolayer;
			};
	  };

export async function importConfig() {
	const def = await import(path.join(process.cwd(), "monolayer.ts"));
	const config: Monolayer = isEsmImport(def)
		? def.default
		: def.default.default;
	return config;
}

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
