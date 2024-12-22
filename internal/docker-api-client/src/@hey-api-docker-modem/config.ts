import type { Plugin } from "@hey-api/openapi-ts";

import { handler } from "./plugin.js";
import type { Config } from "./types.js";

export const defaultConfig: Plugin.Config<Config> = {
	_dependencies: ["@hey-api/schemas", "@hey-api/typescript"],
	_handler: () => {},
	_handlerLegacy: handler,
	name: "docker-modem",
	output: "docker-modem",
};

/**
 * Type helper for `my-plugin` plugin, returns {@link Plugin.Config} object
 */
export const defineConfig: Plugin.DefineConfig<Config> = (config) => ({
	...defaultConfig,
	...config,
});
