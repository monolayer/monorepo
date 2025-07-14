import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";

export const dispatcherAdapterSymbol = Symbol.for(
	"@monolayer/sdk-task-dispacher",
);

const TASK_DISPATCHER_SYMBOL = Symbol.for("@monolayer/sdk/task-dispatcher");

export async function dispatcher(): Promise<typeof developmentDispatch> {
	if (process.env.NODE_ENV === "production") {
		// @ts-expect-error defined at runtime
		const dispatcher = globalThis[TASK_DISPATCHER_SYMBOL];
		if (dispatcher === undefined) throw new Error(`undefined dispatcher`);
		return dispatcher as typeof developmentDispatch;
	} else {
		if (process.env.NODE_ENV === "test") {
			return testDispatch;
		}
		return developmentDispatch;
	}
}
