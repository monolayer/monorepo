import { readFileSync } from "fs";
import next from "next";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "path";
import { fileURLToPath } from "url";
import { appendToAllowedOrigins } from "./append-to-allowed-origins.mjs";
import { APIGatewayProxyEventV2ToAppRequest } from "./request.mjs";
import { AppResponse } from "./response.mjs";

const __dirname = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");

// ServerConfiguration
// Mimic behavior from default standalone server.js. Starting the server without setting
// the environment variable `__NEXT_PRIVATE_STANDALONE_CONFIG` will fail.
// The initialization code tries to load the configuration file (missing in standalone mode).
// Copying the config file is also not an option: it might be a .ts file and the environment
// does not have the required dependencies to compile it.
// Also, we configure a custom cache handler and add the cloudfront domain as allowed origin

const nextConfig = JSON.parse(
	readFileSync(".next/required-server-files.json"),
).config;
nextConfig["cacheHandler"] = "../adapter/cache-handler.mjs";
nextConfig["cacheMaxMemorySize"] = 0;

if (process.env.NEXTJS_ADAPTER_CLOUDFRONT_DOMAIN) {
	appendToAllowedOrigins(
		nextConfig,
		process.env.NEXTJS_ADAPTER_CLOUDFRONT_DOMAIN,
	);
}

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

// Support for `after`
// https://nextjs.org/docs/app/building-your-application/deploying#after
const RequestContextStorage = new AsyncLocalStorage();

const RequestContext = {
	get() {
		return RequestContextStorage.getStore();
	},
};
globalThis[Symbol.for("@next/request-context")] = RequestContext;

// Init app
const app = next({
	hostname: "localhost",
	port: 3000,
	dev: false,
	dir: __dirname,
});
const requestHandler = await app.prepare().then(() => app.getRequestHandler());
// eslint-disable-next-line no-undef
export const handler = awslambda.streamifyResponse(
	async (event, responseStream) => {
		const context = {
			waitUntil: async (val) => {
				await val;
			},
		};
		const req = APIGatewayProxyEventV2ToAppRequest(event);
		const res = new AppResponse(req, responseStream);
		await RequestContextStorage.run(context, async () =>
			requestHandler(req, res),
		);
	},
);
