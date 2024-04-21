import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { computeChangeset } from "./__setup__/helpers/compute-changeset.js";
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

	test<DbContext>("database without tables", async ({ kysely }) => {
		const dbSchema = schema({});
		const cs = await computeChangeset(kysely, dbSchema);
		expect(cs).toEqual([]);
	});
});
