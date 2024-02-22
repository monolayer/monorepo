import { afterEach, beforeEach, describe, test } from "vitest";
import { setUpContext, teardownContext } from "~tests/helpers/test_context.js";
import { type DbContext } from "~tests/setup.js";

describe("Table change migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test.todo<DbContext>("add columns");
	test.todo<DbContext>("remove columns");
	test.todo<DbContext>("rename columns");
	test.todo<DbContext>("change column type");
	test.todo<DbContext>("change column default");
	test.todo<DbContext>("change column not null");
	test.todo<DbContext>("change column unique");
	test.todo<DbContext>("add trigger");
	test.todo<DbContext>("remove trigger");
	test.todo<DbContext>("replace trigger");
});
