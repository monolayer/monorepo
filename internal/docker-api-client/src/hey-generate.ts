import { defaultPlugins } from "@hey-api/openapi-ts";
import { defineConfig } from "./@hey-api-docker-modem/config.js";

export default {
	client: "@hey-api/client-fetch",
	plugins: [
		...defaultPlugins,
		defineConfig({
			name: "docker-modem",
		}),
	],
};
