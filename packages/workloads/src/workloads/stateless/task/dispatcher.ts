import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";

export async function dispatcher() {
	if (process.env.NODE_ENV !== "production") {
		if (process.env.NODE_ENV === "test") {
			return testDispatch;
		}
		return developmentDispatch;
	}
	switch (process.env.MONO_TASK_MODE) {
		case "sqs":
			return (await import("@monolayer/task-sqs-adapter")).sqsDispatch;
		case "bull":
			return (await import("@monolayer/task-bullmq-adapter")).bullDispatch;
		default:
			throw new Error(`undefined dispatcher`);
	}
}
