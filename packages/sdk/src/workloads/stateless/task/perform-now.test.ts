import { assert, expect, test } from "vitest";
import { performNow } from "~workloads/workloads/stateless/task/perform-now.js";
import {
	Task,
	type TaskError,
} from "~workloads/workloads/stateless/task/task.js";

test("invokes single task immediately", async () => {
	const results: Record<string, Record<string, string>> = {};
	const task = new Task<Record<string, string>>(
		"something",
		async ({ taskId, data }) => {
			results[taskId] = data;
		},
		{},
	);
	const firstId = await performNow(task, { city: "BCN" });
	const secondId = await performNow(task, { city: "LON" });

	expect(results).toStrictEqual({
		[`${firstId}`]: { city: "BCN" },
		[`${secondId}`]: { city: "LON" },
	});
});

test("invokes multiple tasks immediately", async () => {
	const results: Record<string, Record<string, string>> = {};
	const task = new Task<Record<string, string>>(
		"something",
		async ({ taskId, data }) => {
			results[taskId] = data;
		},
		{},
	);
	const ids = await performNow(task, [{ city: "BER" }, { city: "MUC" }]);

	assert(Array.isArray(ids));

	expect(results).toStrictEqual({
		[`${ids[0]}`]: { city: "BER" },
		[`${ids[1]}`]: { city: "MUC" },
	});
});

test("calls onError callbak single task immediately", async () => {
	const errors: TaskError<Record<string, string>>[] = [];
	const task = new Task<Record<string, string>>(
		"something",
		async () => {
			throw new Error("fail");
		},
		{
			onError(error) {
				errors.push(error);
			},
		},
	);
	const firstId = await performNow(task, { city: "BCN" });
	const secondIds = await performNow(task, [{ city: "MAD" }, { city: "LON" }]);

	expect(errors.length).toBe(3);

	expect(errors.map((error) => error.cause.executionId)).toStrictEqual([
		firstId,
		...secondIds,
	]);

	expect(errors.map((error) => error.cause.task)).toStrictEqual([
		"something",
		"something",
		"something",
	]);

	expect(errors.map((error) => error.cause.data)).toStrictEqual([
		{ city: "BCN" },
		{ city: "MAD" },
		{ city: "LON" },
	]);

	expect(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		errors.map((error) => (error.cause.error as any).message),
	).toStrictEqual(["fail", "fail", "fail"]);
});
