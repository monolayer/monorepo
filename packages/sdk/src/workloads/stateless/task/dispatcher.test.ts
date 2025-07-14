import { afterEach, expect, test, vi } from "vitest";
import { dispatcher } from "~workloads/workloads/stateless/task/dispatcher.js";
import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";

const dispatcherSymbol = Symbol.for("@monolayer/sdk/task-dispatcher");

afterEach(() => {
	vi.unstubAllEnvs();
	//@ts-expect-error untyped
	globalThis[dispatcherSymbol] = undefined;
});

test(
	"is dev dispatcher in non production environments",
	{ sequential: true, concurrent: false },
	async () => {
		vi.stubEnv("NODE_ENV", "development");
		expect(await dispatcher()).toBe(developmentDispatch);
	},
);

test(
	"is test dispatcher in non production environments",
	{ sequential: true, concurrent: false },
	async () => {
		vi.stubEnv("NODE_ENV", "test");
		expect(await dispatcher()).toBe(testDispatch);
	},
);

test(
	"throws in production environments when globalThis[TASK_DISPATCHER_SYMBOL] is not set",
	{ sequential: true, concurrent: false },
	async () => {
		vi.stubEnv("NODE_ENV", "production");
		await expect(dispatcher).rejects.toThrow("undefined dispatcher");
	},
);

test(
	"dispatcher in production environments from globalThis[TASK_DISPATCHER_SYMBOL]",
	{ sequential: true, concurrent: false },
	async () => {
		vi.stubEnv("NODE_ENV", "production");
		//@ts-expect-error untyped
		globalThis[dispatcherSymbol] = "fake-dispatcher";
		expect(await dispatcher()).toBe("fake-dispatcher");
	},
);
