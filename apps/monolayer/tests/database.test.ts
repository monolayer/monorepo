import { schema } from "@monorepo/pg/schema/schema.js";
import { afterEach, beforeEach, describe, test } from "vitest";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "./__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "./__setup__/helpers/test-context.js";

describe("Database migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("database without tables", async (context) => {
		const dbSchema = schema({});

		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: [],
			down: "same",
		});
	});
});
