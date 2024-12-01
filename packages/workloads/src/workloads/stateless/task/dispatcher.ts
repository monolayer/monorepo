import { bullDispatch } from "~workloads/workloads/stateless/task/bull.js";
import { localDispatch } from "~workloads/workloads/stateless/task/local.js";
import { sqsDispatch } from "~workloads/workloads/stateless/task/sqs.js";

export function dispatcher() {
	if (process.env.NODE_ENV !== "production") {
		return localDispatch;
	}
	switch (process.env.MONO_TASK_MODE) {
		case "sqs":
			return sqsDispatch;
		case "bull":
			return bullDispatch;
		default:
			throw new Error(`undefined dispatcher`);
	}
}
