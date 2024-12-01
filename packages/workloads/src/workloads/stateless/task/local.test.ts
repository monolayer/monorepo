import { beforeEach, expect, test, vi } from "vitest";
import { Task } from "~workloads/workloads/stateless/task/task.js";

beforeEach(() => {
	vi.stubEnv("MONO_TASK_MODE", undefined);
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
