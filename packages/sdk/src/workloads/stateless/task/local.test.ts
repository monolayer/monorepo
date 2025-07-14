import { assert, beforeEach, describe, expect, test, vi } from "vitest";
import { dispatcherForTask } from "~workloads/workloads/stateless/task/local.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

beforeEach(() => {
	vi.stubEnv("ML_TASK_MODE", undefined);
});

describe("dev dispatcher", () => {
	beforeEach(() => {
		vi.stubEnv("NODE_ENV", "development");
	});

	test("perform later performs now", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let testData: any;
		const testTask = new Task(
			"Send emails",
			async ({ data }) => {
				testData = data;
			},
			{},
		);
		await testTask.performLater({ hello: "world" });

		expect(testData).toStrictEqual({ hello: "world" });
	});

	test("perform later performs now in bulk", async () => {
		vi.stubEnv("NODE_ENV", "development");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let testData: any;
		const testTask = new Task<Record<string, string>>(
			"Send emails",
			async ({ data }) => {
				testData = {
					...testData,
					...data,
				};
			},
			{},
		);
		await testTask.performLater([{ hello: "world" }, { foo: "bar" }]);

		expect(testData).toStrictEqual({ hello: "world", foo: "bar" });
	});
});

describe("test dispatcher", () => {
	beforeEach(() => {
		vi.stubEnv("NODE_ENV", "test");
	});

	test("perform later collects now", async () => {
		const testTask = new Task<{ word: string }>(
			"Send emails",
			async () => {},
			{},
		);

		const executionId = await testTask.performLater({ word: "world" });

		const dispatcher = dispatcherForTask(testTask);

		const performedTask = dispatcher[0];
		assert(performedTask);
		expect(performedTask.executionId).toStrictEqual(executionId);
		expect(performedTask.data).toStrictEqual({ word: "world" });
	});

	test("perform later performs collects in bulk", async () => {
		const testTask = new Task<{ word: string }>(
			"Send emails bulk",
			async () => {},
			{},
		);

		const executionIds = await testTask.performLater([
			{ word: "world" },
			{ word: "hello" },
		]);

		const dispatcher = dispatcherForTask(testTask);

		const performedTaskOne = dispatcher[0];
		assert(performedTaskOne);
		expect(performedTaskOne.executionId).toStrictEqual(executionIds[0]);
		expect(performedTaskOne.data).toStrictEqual({ word: "world" });

		const performedTaskTwo = dispatcher[1];
		assert(performedTaskTwo);
		expect(performedTaskTwo.executionId).toStrictEqual(executionIds[1]);
		expect(performedTaskTwo.data).toStrictEqual({ word: "hello" });
	});
});
