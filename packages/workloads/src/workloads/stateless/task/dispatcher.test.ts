import { afterEach, expect, test, vi } from "vitest";
import { bullDispatch } from "~workloads/workloads/stateless/task/bull.js";
import { dispatcher } from "~workloads/workloads/stateless/task/dispatcher.js";
import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";
import { sqsDispatch } from "~workloads/workloads/stateless/task/sqs.js";

afterEach(() => {
	vi.unstubAllEnvs();
});

test(
	"is dev dispatcher in non production environments",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "development");
		expect(dispatcher()).toBe(developmentDispatch);
	},
);

test(
	"is test dispatcher in non production environments",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "test");
		expect(dispatcher()).toBe(testDispatch);
	},
);

test(
	"is bull dispatcher in production environments when MONO_TASK_MODE is bull",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "bull");
		expect(dispatcher()).toBe(bullDispatch);
	},
);

test(
	"is sqs dispatcher in production environments when MONO_TASK_MODE is sqs",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "sqs");
		expect(dispatcher()).toBe(sqsDispatch);
	},
);

test(
	"throws in production environments when MONO_TASK_MODE is not set",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "production");
		expect(() => dispatcher()).throws("undefined dispatcher");
	},
);

test(
	"throws in production environments when MONO_TASK_MODE is not sqs or bull",
	{ sequential: true, concurrent: false },
	() => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MONO_TASK_MODE", "something");
		expect(() => dispatcher()).throws("undefined dispatcher");
	},
);
