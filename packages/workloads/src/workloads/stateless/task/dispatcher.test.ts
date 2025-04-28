import { bullDispatch } from "@monolayer/task-bullmq-adapter";
// @ts-expect-error evailable in runtime
import { sqsDispatch, sqsSingleDispatch } from "@monolayer/task-sqs-adapter";
import { afterEach, expect, test, vi } from "vitest";
import { dispatcher } from "~workloads/workloads/stateless/task/dispatcher.js";
import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";

afterEach(() => {
	vi.unstubAllEnvs();
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
	"is bull dispatcher in production environments when MONO_TASK_MODE is bull",
	{ sequential: true, concurrent: false },
	async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "bull");
		expect(await dispatcher()).toBe(bullDispatch);
	},
);

test(
	"is sqs dispatcher in production environments when MONO_TASK_MODE is sqs",
	{ sequential: true, concurrent: false },
	async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "sqs");
		expect(await dispatcher()).toBe(sqsDispatch);
	},
);

test(
	"is sqs single dispatcher in production environments when MONO_TASK_MODE is sqs-single",
	{ sequential: true, concurrent: false },
	async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "sqs-single");
		expect(await dispatcher()).toBe(sqsSingleDispatch);
	},
);

test(
	"throws in production environments when MONO_TASK_MODE is not set",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "production");
		expect(dispatcher).rejects.toThrow("undefined dispatcher");
	},
);

test(
	"throws in production environments when MONO_TASK_MODE is not sqs or bull",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "something");
		expect(dispatcher).rejects.toThrow("undefined dispatcher");
	},
);
