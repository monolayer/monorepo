import { expect, test, vi } from "vitest";
import { performLater } from "~workloads/workloads/stateless/task/perform-later.js";
import type { ExecutionId } from "~workloads/workloads/stateless/task/perform-now.js";
import {
	PerformOptions,
	Task,
} from "~workloads/workloads/stateless/task/task.js";

vi.mock(
	import("~workloads/workloads/stateless/task/dispatcher.js"),
	async (importOriginal) => {
		const actual =
			(await importOriginal()) as typeof import("~workloads/workloads/stateless/task/dispatcher.js");
		return {
			...actual,
			dispatcher: vi.fn().mockImplementation(() =>
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				async <P>(_task: Task<P>, _data: P, _options?: PerformOptions) => {
					return "mockDispatch" as ExecutionId;
				},
			),
		};
	},
);

test("sends task to dispatcher", async () => {
	const executionId = await performLater(
		new Task("something", async () => {}, {}),
		{ hello: "world" },
		{ delay: 1 },
	);
	expect(executionId).toStrictEqual("mockDispatch");
});
