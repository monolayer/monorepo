import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import { pgVarchar } from "~/database/schema/columns.js";
import { pgDatabase } from "~/database/schema/database.js";
import { pgTable } from "~/database/schema/table.js";

describe("pgDatabase definition", () => {
	test("without tables", () => {
		const database = pgDatabase({});
		// biome-ignore lint/complexity/noBannedTypes: <explanation>
		const expect: Expect<Equal<typeof database, pgDatabase<{}>>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("with tables", () => {
		const users = pgTable("users", {
			columns: {
				name: pgVarchar(),
			},
		});
		const teams = pgTable("teams", {
			columns: {
				name: pgVarchar(),
			},
		});
		const database = pgDatabase({
			users,
			teams,
		});
		expect(database.tables?.users).toBe(users);
		expect(database.tables?.teams).toBe(teams);

		const expectation: Expect<
			Equal<
				typeof database,
				pgDatabase<{ users: typeof users; teams: typeof teams }>
			>
		> = true;
		expectTypeOf(expectation).toMatchTypeOf<boolean>();
	});
});
