import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	client: {
		bundle: true,
		name: "@hey-api/client-fetch",
	},
	input: "packages/sidecar/src/testing/mailpit-api/swagger.json",
	output: "packages/sidecar/src/testing/mailpit-api/generated",
});
