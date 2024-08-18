import { afterEach, beforeEach, vi } from "vitest";
import {
	dropTestDatabase,
	setDefaultDatabaseURL,
} from "~programs/__test_setup__/database.js";
import {
	setupProgramContext,
	teardownProgramContext,
	testDatabaseName,
} from "~programs/__test_setup__/program_context.js";

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
	await dropTestDatabase(context);
	await teardownProgramContext(context);
	vi.resetAllMocks();
});

export interface TestProgramContext {
	databaseName: string;
	logMessages: string[];
}
