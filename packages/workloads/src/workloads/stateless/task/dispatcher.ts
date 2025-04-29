import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";

const sqsAdapter = "@monolayer/task-sqs-adapter";
const bullMQAdapter = "@monolayer/task-bullmq-adapter";

export async function dispatcher(): Promise<typeof developmentDispatch> {
	if (process.env.NODE_ENV !== "production") {
		if (process.env.NODE_ENV === "test") {
			return testDispatch;
		}
		return developmentDispatch;
	}
	switch (process.env.MONO_TASK_MODE) {
		case "sqs":
			return (await import(sqsAdapter)).sqsDispatch;
		case "bull":
			return (await import(bullMQAdapter)).bullDispatch;
		default:
			throw new Error(`undefined dispatcher`);
	}
}
