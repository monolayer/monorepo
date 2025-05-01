import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";

export const dispatcherAdapterSymbol = Symbol.for(
	"@monolayer/workloads-task-dispacher",
);

export async function dispatcher(): Promise<typeof developmentDispatch> {
	if (process.env.NODE_ENV === "production") {
		const dispatcherLib = process.env.TASK_DISPATCHER;
		if (dispatcherLib == undefined)
			throw new Error(`undefined TASK_DISPATCHER`);

		const dispatcher = (await import(dispatcherLib))
			.dispatcher as typeof developmentDispatch;

		if (dispatcher === undefined) throw new Error(`undefined dispatcher`);
		return dispatcher;
	} else {
		if (process.env.NODE_ENV === "test") {
			return testDispatch;
		}
		return developmentDispatch;
	}
}
