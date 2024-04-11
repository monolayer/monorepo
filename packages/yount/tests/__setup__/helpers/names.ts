import { type TaskContext } from "vitest";

export function dbNameForTest(context: TaskContext) {
	return context.task.name.replace(/ /g, "_").toLowerCase();
}

export function programFolder(context: TaskContext) {
	return [context.task.id.replace("-", ""), context.task.name]
		.join("-")
		.replace(/ /g, "-")
		.toLowerCase();
}
