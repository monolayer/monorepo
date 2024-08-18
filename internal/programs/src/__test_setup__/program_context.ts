import { hashValue } from "@monorepo/utils/hash-value.js";
import { mkdirSync, rmSync } from "node:fs";
import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";
import type { TaskContext } from "vitest";

export async function setupProgramContext(context: TaskContext) {
	const folder = programFolder(context);
	rmSync(folder, { recursive: true, force: true });
	mkdirSync(folder, { recursive: true });
	await fs.cp(
		path.join(
			currentWorkingDirectory(),
			"src",
			"__test_setup__",
			"fixtures",
			"app",
		),
		folder,
		{ recursive: true },
	);
	chdir(folder);
}

export async function teardownProgramContext(context: TaskContext) {
	rmSync(programFolder(context), { recursive: true, force: true });
	chdir(currentWorkingDirectory());
}

export function currentWorkingDirectory() {
	return path.resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function programFolder(context: TaskContext) {
	return path.join(
		currentWorkingDirectory(),
		"tmp",
		[context.task.id.replace("-", ""), context.task.name]
			.join("-")
			.replace(/ /g, "-")
			.toLowerCase(),
	);
}

export function migrationFolder(context: TaskContext) {
	return path.join(programFolder(context), "monolayer/migrations/default");
}

export function testDatabaseName(context: TaskContext) {
	const parts = [];
	if (context.task.suite !== undefined) {
		parts.push(context.task.suite.name.replace(/ /g, "_").toLowerCase());
	}
	parts.push(context.task.name.replace(/ /g, "_").toLowerCase());
	return hashValue(`${parts.join("_")}`);
}
