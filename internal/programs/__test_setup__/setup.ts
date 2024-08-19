import dotenv from "dotenv";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";
import {
	dropTestDatabase,
	setDefaultDatabaseURL,
} from "~test-setup/database.js";
import {
	currentWorkingDirectory,
	setupProgramContext,
	teardownProgramContext,
	testDatabaseName,
} from "~test-setup/program_context.js";

beforeAll(async () => {
	dotenv.config({
		path: path.resolve(currentWorkingDirectory(), ".env.test"),
	});
});

beforeEach<TestProgramContext>(async (context) => {
	context.logMessages = [];
	context.databaseName = testDatabaseName(context);
	vi.spyOn(process.stdout, "write").mockImplementation((data) => {
		context.logMessages.push(
			typeof data === "string" ? data : Buffer.from(data).toString(),
		);
		return true;
	});
	await dropTestDatabase(context);
	setDefaultDatabaseURL(context.databaseName);

	await setupProgramContext(context);
});

afterEach<TestProgramContext>(async (context) => {
	await teardownProgramContext(context);
	vi.resetAllMocks();
});

export interface TestProgramContext {
	databaseName: string;
	logMessages: string[];
}
