import { readFileSync } from "fs";
import next from "next";
import imageOptimizer from "next/dist/server/image-optimizer.js";
import ResponseCache from "next/dist/server/response-cache/index.js";
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

process.env.NEXTJS_ADAPTER_BUILD_ID = readFileSync(".next/BUILD_ID")
	.toString()
	.trim();

if (process.env.NEXTJS_ADAPTER_CLOUDFRONT_DOMAIN) {
	appendToAllowedOrigins(
		nextConfig,
		process.env.NEXTJS_ADAPTER_CLOUDFRONT_DOMAIN,
	);
}

// Only /tmp is writable.
// Patch ImageOptimizerCache cacheDir location
Object.defineProperty(
	imageOptimizer.ImageOptimizerCache.prototype,
	"cacheDir",
	{
		get() {
			return "/tmp/cache";
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		set(value) {},
	},
);

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

// Adapted from
// https://github.com/opennextjs/opennextjs-netlify/blob/main/src/run/handlers/request-context.cts

const originalGet = ResponseCache.default.prototype.get;

ResponseCache.default.prototype.get = function get(...getArgs) {
	if (!this.didAddBackgroundWorkTracking) {
		if (typeof this.batcher !== "undefined") {
			const originalBatcherBatch = this.batcher.batch;
			this.batcher.batch = async (key, fn) => {
				const trackedFn = async (...workFnArgs) => {
					const workPromise = fn(...workFnArgs);
					globalThis[TRACKED_PROMISES].push(workPromise);
					return await workPromise;
				};
				return originalBatcherBatch.call(this.batcher, key, trackedFn);
			};
		} else if (typeof this.pendingResponses !== "undefined") {
			const backgroundWork = new Map();

			const originalPendingResponsesSet = this.pendingResponses.set;
			this.pendingResponses.set = async (key, value) => {
				if (!this.pendingResponses.has(key)) {
					const workPromise = new Promise((_resolve) => {
						backgroundWork.set(key, _resolve);
					});
					globalThis[TRACKED_PROMISES].push(workPromise);
				}
				return originalPendingResponsesSet.call(
					this.pendingResponses,
					key,
					value,
				);
			};

			const originalPendingResponsesDelete = this.pendingResponses.delete;
			this.pendingResponses.delete = async (key) => {
				const _resolve = backgroundWork.get(key);
				if (_resolve) {
					await _resolve();
				}
				return originalPendingResponsesDelete.call(this.pendingResponses, key);
			};
		}

		this.didAddBackgroundWorkTracking = true;
	}
	return originalGet.apply(this, getArgs);
};

// Init app
const app = next({
	hostname: "localhost",
	port: 3000,
	dev: false,
	dir: __dirname,
});

const TRACKED_PROMISES = Symbol.for("@monolayer/tracked-promises");
globalThis[TRACKED_PROMISES] = [];

await app.prepare();
const requestHandler = app.getRequestHandler();

// eslint-disable-next-line no-undef
export const handler = awslambda.streamifyResponse(
	async (event, responseStream, lambdaContext) => {
		lambdaContext.callbackWaitsForEmptyEventLoop = false;
		globalThis[TRACKED_PROMISES] = [];
		const context = {
			waitUntil: async (val) => {
				await val;
			},
		};
		const req = APIGatewayProxyEventV2ToAppRequest(event);
		const res = new AppResponse(req, responseStream);
		await new Promise((resolve, reject) => {
			responseStream.on("finish", () => {
				resolve();
			});
			responseStream.on("error", (err) => {
				reject(err);
			});
			RequestContextStorage.run(context, async () => requestHandler(req, res));
		});
		await Promise.allSettled(globalThis[TRACKED_PROMISES]);
	},
);
