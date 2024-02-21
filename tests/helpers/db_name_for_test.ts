import { type TaskContext } from "vitest";

export function dbNameForTest(context: TaskContext) {
	return context.task.name.replace(/ /g, "_").toLowerCase();
}
