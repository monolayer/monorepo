import { bullDispatch } from "~workloads/workloads/stateless/task/bull.js";
import {
	developmentDispatch,
	testDispatch,
} from "~workloads/workloads/stateless/task/local.js";
import {
	sqsDispatch,
	sqsSingleDispatch,
} from "~workloads/workloads/stateless/task/sqs.js";

export function dispatcher() {
	if (process.env.NODE_ENV !== "production") {
		if (process.env.NODE_ENV === "test") {
			return testDispatch;
		}
		return developmentDispatch;
	}
	switch (process.env.MONO_TASK_MODE) {
		case "sqs":
			return sqsDispatch;
		case "sqs-single":
			return sqsSingleDispatch;
		case "bull":
			return bullDispatch;
		default:
			throw new Error(`undefined dispatcher`);
	}
}
