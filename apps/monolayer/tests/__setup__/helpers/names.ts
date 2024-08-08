import { hashValue } from "@monorepo/utils/hash-value";
import { type Suite, type TaskContext } from "vitest";

export function dbNameForTest(context: TaskContext) {
	const parts = [];
	let suite: Suite | undefined;
	suite = context.task.suite;
	while (suite !== undefined) {
		parts.push(suite.name.replace(/ /g, "_").toLowerCase());
		suite = suite.suite;
	}
	const task = context.task.name.replace(/ /g, "_").toLowerCase();
	return hashValue(`${parts.join("_")}_${task}`);
}

export function programFolder(context: TaskContext) {
	return [context.task.id.replace("-", ""), context.task.name]
		.join("-")
		.replace(/ /g, "-")
		.toLowerCase();
}
