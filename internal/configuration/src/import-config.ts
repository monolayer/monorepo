import { ActionError } from "@monorepo/cli/errors.js";
import { importDefault } from "@monorepo/utils/import-default.js";
import { fail, gen } from "effect/Effect";
import path from "node:path";
import { MonolayerConfig } from "~configuration/monolayer.js";

export const importConfig = gen(function* () {
	const configPath = path.join(process.cwd(), "monolayer.config.ts");
	const imported = yield* importDefault(configPath);
	return isMonolayerConfig(imported) ? imported : yield* missingConfiguration;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMonolayerConfig(def: any): def is MonolayerConfig {
	return (
		def !== undefined && def.constructor instanceof MonolayerConfig.constructor
	);
}

const missingConfiguration = fail(
	new ActionError(
		"Missing configuration",
		`Could not find the configuration in \`monolayer.config.ts\`.`,
	),
);
