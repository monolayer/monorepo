import { type TaskContext } from "vitest";
import { hashValue } from "~/utils.js";

export function dbNameForTest(context: TaskContext) {
	const suite = context.task.suite.name.replace(/ /g, "_").toLowerCase();
	const task = context.task.name.replace(/ /g, "_").toLowerCase();
	return hashValue(`${suite}_${task}`);
}

export function programFolder(context: TaskContext) {
	return [context.task.id.replace("-", ""), context.task.name]
		.join("-")
		.replace(/ /g, "-")
		.toLowerCase();
}
